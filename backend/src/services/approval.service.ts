import { Op } from 'sequelize';
import { Booking, BookingStatus, MeetingRoom, User, RoomOwner, BookingEquipment, Equipment } from '../models';
import { logAudit } from './auditlog.service';
import { createNotification } from './notification.service';
import { sendBookingNotification } from './email.service';

export class ApprovalService {
  static async getPendingRooms(userId: number, roleCode: string) {
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
    const baseWhere: any = {
      equipment_status: 'pending'
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
