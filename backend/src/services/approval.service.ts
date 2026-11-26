import { Op } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom, User, RoomOwner, BookingEquipment, Equipment } from '../models';
import { logAudit } from './auditlog.service';
import { createNotification } from './notification.service';
import { sendBookingNotification, sendAutoApproveOwnerNotification } from './email.service';
import { syncBookingToTrainingSystem } from '../utils/training.util';

export class ApprovalService {
  private static isAutoApproving = false;

  /**
   * Auto-approves pending room bookings and pending equipment requests
   * whose booking_date has passed by at least `overdueDays` days (default: 3 days),
   * and emails the room owners with full booking details.
   */
  static async autoApproveOverdueBookings(overdueDays: number = 3): Promise<number> {
    if (this.isAutoApproving) return 0;
    this.isAutoApproving = true;

    try {
      const cutoff = new Date();
      cutoff.setMinutes(cutoff.getMinutes() - cutoff.getTimezoneOffset());
      cutoff.setDate(cutoff.getDate() - overdueDays);
      const cutoffDateStr = cutoff.toISOString().split('T')[0];

      const statuses = await BookingStatus.findAll();
      const pendingStatus = statuses.find(s => s.status_code === 'pending');
      const approvedStatus = statuses.find(s => s.status_code === 'approved');
      const excludedStatusIds = statuses
        .filter(s => s.status_code === 'cancelled' || s.status_code === 'rejected')
        .map(s => s.id);

      if (!pendingStatus || !approvedStatus) return 0;

      const overdueBookings = await Booking.findAll({
        where: {
          booking_date: { [Op.lte]: cutoffDateStr },
          status_id: { [Op.notIn]: excludedStatusIds },
          [Op.or]: [
            { status_id: pendingStatus.id },
            { equipment_status: 'pending' },
          ],
        },
        include: [
          { model: MeetingRoom, as: 'Room', include: [{ model: User, as: 'Owners' }] },
          { model: User, as: 'User' },
          { model: BookingStatus, as: 'Status' },
          { model: BookingEquipment, as: 'BookingEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
        ],
        order: [['booking_date', 'ASC']],
      });

      let processedCount = 0;

      for (const booking of overdueBookings) {
        const autoApprovedItems: string[] = [];
        let roomJustApproved = false;

        if (booking.status_id === pendingStatus.id) {
          booking.status_id = approvedStatus.id;
          booking.approved_at = new Date();
          autoApprovedItems.push('อนุมัติการจองห้องประชุม (Pending Approvals)');
          roomJustApproved = true;
        }

        if (booking.equipment_status === 'pending') {
          booking.equipment_status = 'approved';
          autoApprovedItems.push('อนุมัติคำขออุปกรณ์เสริม (Equipment Approvals)');
        }

        if (autoApprovedItems.length === 0) continue;

        const autoNote = `[ระบบอนุมัติอัตโนมัติ เนื่องจากเลยกำหนดวันประชุมเกิน ${overdueDays} วัน: ${autoApprovedItems.join(', ')}]`;
        booking.edit_notes = booking.edit_notes ? `${booking.edit_notes}\n${autoNote}` : autoNote;
        await booking.save();

        await logAudit('bookings', booking.id, 'UPDATE', null, {
          auto_approved: autoApprovedItems,
          booking_date: booking.booking_date,
          cutoff_date: cutoffDateStr,
        });

        if (roomJustApproved && booking.link_training_system) {
          const organizerName = (booking as any).User
            ? `${(booking as any).User.first_name} ${(booking as any).User.last_name}`
            : (booking.guest_name || '');
          await syncBookingToTrainingSystem({
            natprachum_booking_id: booking.id,
            booking_no: booking.booking_no,
            booking_name: booking.booking_name,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            room_name: (booking as any).Room?.room_name,
            location: (booking as any).Room?.location,
            organizer: organizerName,
            participant_count: booking.participant_count,
            purpose: booking.purpose,
            status: 'open',
          }).catch(console.error);
        }

        // Notify Room Owners via in-app notification and email
        const room: any = (booking as any).Room;
        const notifiedEmails = new Set<string>();

        if (room?.Owners && Array.isArray(room.Owners)) {
          for (const owner of room.Owners) {
            await createNotification(
              owner.id,
              'ระบบอนุมัติอัตโนมัติ (เลยกำหนด 3 วัน)',
              `ใบจอง ${booking.booking_no} (${booking.booking_name}) ห้อง ${room.room_name} วันที่ ${booking.booking_date} ได้รับการอนุมัติอัตโนมัติ (${autoApprovedItems.join(', ')})`,
              'booking_approved',
              booking.id,
              'booking'
            ).catch(console.error);

            if (owner.email) {
              const normEmail = String(owner.email).trim().toLowerCase();
              if (!notifiedEmails.has(normEmail)) {
                notifiedEmails.add(normEmail);
                await sendAutoApproveOwnerNotification(owner.email, booking, autoApprovedItems, owner.id).catch(console.error);
              }
            }
          }
        }

        if (room?.owner_email) {
          const normOwnerEmail = String(room.owner_email).trim().toLowerCase();
          if (normOwnerEmail && !notifiedEmails.has(normOwnerEmail)) {
            notifiedEmails.add(normOwnerEmail);
            await sendAutoApproveOwnerNotification(room.owner_email, booking, autoApprovedItems).catch(console.error);
          }
        }

        processedCount++;
      }

      if (processedCount > 0) {
        console.log(`[AUTO-APPROVE] Auto-approved ${processedCount} overdue booking(s) (booking_date <= ${cutoffDateStr}).`);
      }

      return processedCount;
    } catch (err) {
      console.error('[AUTO-APPROVE] Error auto-approving overdue bookings:', err);
      return 0;
    } finally {
      this.isAutoApproving = false;
    }
  }

  static async getPendingRooms(userId: number, roleCode: string) {
    await this.autoApproveOverdueBookings(3);

    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    if (!pendingStatus) return [];

    const baseWhere: any = {
      status_id: pendingStatus.id
    };

    if (roleCode === 'RoomOwner') {
      const ownedRooms = await RoomOwner.findAll({ where: { user_id: userId }, attributes: ['room_id'] });
      baseWhere.room_id = { [Op.in]: ownedRooms.map(r => r.room_id) };
    }

    return Booking.findAll({
      where: baseWhere,
      include: [
        { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'] },
        { model: User, as: 'User', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: BookingStatus, as: 'Status' },
        { model: BookingEquipment, as: 'BookingEquipments', include: [{ model: Equipment, as: 'Equipment' }] }
      ],
      order: [['created_at', 'ASC']],
    });
  }

  static async getPendingEquipment(userId: number, roleCode: string) {
    await this.autoApproveOverdueBookings(3);

    const activeStatuses = await BookingStatus.findAll({
      where: { status_code: { [Op.notIn]: ['cancelled', 'rejected'] } },
      attributes: ['id'],
    });

    const baseWhere: any = {
      equipment_status: 'pending',
      status_id: { [Op.in]: activeStatuses.map(s => s.id) },
    };

    if (roleCode === 'RoomOwner') {
      const ownedRooms = await RoomOwner.findAll({ where: { user_id: userId }, attributes: ['room_id'] });
      baseWhere.room_id = { [Op.in]: ownedRooms.map(r => r.room_id) };
    }

    return Booking.findAll({
      where: baseWhere,
      include: [
        { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'] },
        { model: User, as: 'User', attributes: ['id', 'first_name', 'last_name', 'email'] },
        { model: BookingStatus, as: 'Status' },
        { model: BookingEquipment, as: 'BookingEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
      ],
      order: [['created_at', 'ASC']],
    });
  }

  private static async notifyUser(booking: any, status: string, changes?: string[]) {
    const email = booking.is_guest_booking ? booking.guest_email : booking.User?.email;
    const roomName = booking.Room?.room_name || 'Unknown Room';
    
    if (email) {
      await sendBookingNotification(
        email,
        booking.booking_name,
        roomName,
        status,
        booking.booking_date,
        booking.start_time,
        booking.end_time,
        booking.user_id,
        changes,
        booking.id
      ).catch(console.error);
    }
  }

  static async approve(bookingId: number, approvedBy: number) {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: MeetingRoom, as: 'Room', include: [{ model: User, as: 'Owners' }] }, { model: User, as: 'User' }],
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    if (booking.status_id !== pendingStatus?.id) {
      throw { statusCode: 400, message: 'Can only approve pending bookings' };
    }

    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    booking.status_id = approvedStatus!.id;
    booking.approved_by = approvedBy;
    booking.approved_at = new Date();
    await booking.save();

    await logAudit('bookings', booking.id, 'UPDATE', null, { status: 'approved' }, approvedBy);
    if (booking.user_id) await createNotification(booking.user_id, 'Booking Approved', `Your booking ${booking.booking_no} has been approved`, 'booking_approved', booking.id, 'booking');
    
    this.notifyUser(booking, 'approved');
    if (booking.link_training_system) {
      const organizerName = booking.User ? `${booking.User.first_name} ${booking.User.last_name}` : (booking.guest_name || '');
      await syncBookingToTrainingSystem({
        natprachum_booking_id: booking.id,
        booking_no: booking.booking_no,
        booking_name: booking.booking_name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        room_name: booking.Room?.room_name,
        location: booking.Room?.location,
        organizer: organizerName,
        participant_count: booking.participant_count,
        purpose: booking.purpose,
        status: 'open',
      });
    }
    return booking;
  }

  static async reject(bookingId: number, rejectedBy: number, reason: string) {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: MeetingRoom, as: 'Room' }, { model: User, as: 'User' }]
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    const rejectedStatus = await BookingStatus.findOne({ where: { status_code: 'rejected' } });
    booking.status_id = rejectedStatus!.id;
    booking.reject_reason = reason;
    await booking.save();

    await logAudit('bookings', booking.id, 'UPDATE', null, { status: 'rejected', reason }, rejectedBy);
    if (booking.user_id) await createNotification(booking.user_id, 'Booking Rejected', `Your booking ${booking.booking_no} was rejected: ${reason}`, 'booking_rejected', booking.id, 'booking');
    
    this.notifyUser(booking, 'rejected');
    if (booking.link_training_system) {
      await syncBookingToTrainingSystem({
        natprachum_booking_id: booking.id,
        booking_no: booking.booking_no,
        booking_name: booking.booking_name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        room_name: booking.Room?.room_name,
        location: booking.Room?.location,
        participant_count: booking.participant_count,
        purpose: booking.purpose,
        status: 'cancelled',
      });
    }
    return booking;
  }

  static async approveEquipment(bookingId: number, approvedBy: number) {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: MeetingRoom, as: 'Room' }, { model: User, as: 'User' }]
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    if (booking.equipment_status !== 'pending') {
      throw { statusCode: 400, message: 'Can only approve pending equipment requests' };
    }

    booking.equipment_status = 'approved';
    booking.equipment_approved_by = approvedBy;
    await booking.save();

    await logAudit('bookings', booking.id, 'UPDATE', null, { equipment_status: 'approved' }, approvedBy);
    
    if (booking.user_id) await createNotification(booking.user_id, 'Equipment Approved', `Your equipment request for booking ${booking.booking_no} has been approved`, 'booking_updated', booking.id, 'booking');

    this.notifyUser(booking, 'updated', ['Equipment Request Approved']);
    return booking;
  }

  static async rejectEquipment(bookingId: number, rejectedBy: number, reason: string) {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: MeetingRoom, as: 'Room' }, { model: User, as: 'User' }]
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    if (booking.equipment_status !== 'pending') {
      throw { statusCode: 400, message: 'Can only reject pending equipment requests' };
    }

    booking.equipment_status = 'rejected';
    booking.equipment_reject_reason = reason;
    await booking.save();

    await logAudit('bookings', booking.id, 'UPDATE', null, { equipment_status: 'rejected', reason }, rejectedBy);
    
    if (booking.user_id) await createNotification(booking.user_id, 'Equipment Rejected', `Your equipment request for booking ${booking.booking_no} was rejected: ${reason}`, 'booking_updated', booking.id, 'booking');

    this.notifyUser(booking, 'updated', ['Equipment Request Rejected: ' + reason]);
    return booking;
  }
}
