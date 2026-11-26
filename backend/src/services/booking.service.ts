import { Op, Sequelize } from 'sequelize';
import { Booking, BookingStatus, BookingParticipant, MeetingRoom, User, Company, CompanyHoliday, FoodOrder, FoodOrderDiner, BookingEquipment, Equipment } from '../models';
import { getPagination, getSorting } from '../utils/pagination';
import { generateBookingNo } from '../utils/bookingNo';
import { logAudit } from './auditlog.service';
import { createNotification } from './notification.service';
import { sendBookingNotification } from './email.service';
import { updatePaymentStatus } from '../utils/payment.util';
import { syncBookingToTrainingSystem } from '../utils/training.util';

export class BookingService {
  private static isBookingOwner(booking: Booking, userId?: number, guestEmail?: string): boolean {
    if (userId && booking.user_id === userId) return true;
    if (guestEmail && booking.is_guest_booking && booking.guest_email) {
      return booking.guest_email.trim().toLowerCase() === guestEmail.trim().toLowerCase();
    }
    return false;
  }

  static async getAll(query: any) {
    const { page, limit, offset } = getPagination(query);
    const { sortBy, sortOrder } = getSorting(query, ['created_at', 'booking_date', 'booking_name']);

    const where: any = {};
    const andConditions: any[] = [];
    if (query.search) {
      andConditions.push({
        [Op.or]: [
          { booking_no: { [Op.like]: `%${query.search}%` } },
          { booking_name: { [Op.like]: `%${query.search}%` } },
        ],
      });
    }
    if (query.owner_user_id || query.owner_email) {
      const ownerConditions: any[] = [];
      if (query.owner_user_id) ownerConditions.push({ user_id: query.owner_user_id });
      if (query.owner_email) {
        ownerConditions.push({
          [Op.and]: [
            { is_guest_booking: true },
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('Booking.guest_email')),
              String(query.owner_email).trim().toLowerCase()
            ),
          ],
        });
      }
      andConditions.push({ [Op.or]: ownerConditions });
    }
    if (andConditions.length > 0) {
      where[Op.and] = andConditions;
    }
    if (query.room_id) where.room_id = query.room_id;
    if (query.status_id) where.status_id = query.status_id;
    if (query.user_id) where.user_id = query.user_id;
    if (query.booking_date) where.booking_date = query.booking_date;
    if (query.is_guest_booking !== undefined) where.is_guest_booking = query.is_guest_booking === 'true';
    if (query.date_from && query.date_to) {
      where.booking_date = { [Op.between]: [query.date_from, query.date_to] };
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location', 'capacity'] },
        { model: User, as: 'User', attributes: ['id', 'first_name', 'last_name', 'username', 'email', 'mobile_phone', 'office_phone', 'department_code', 'department_name', 'company_id'], include: [{ model: Company, as: 'Company', attributes: ['company_name', 'company_code'] }] },
        { model: BookingStatus, as: 'Status' },
        { model: User, as: 'Approver', attributes: ['id', 'first_name', 'last_name'] },
        { model: FoodOrder, as: 'FoodOrder', attributes: ['id', 'food_status'] },
        { model: BookingEquipment, as: 'BookingEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
      distinct: true,
    });

    return { data: rows, total: count, page, limit };
  }

  static async getById(id: number) {
    const booking = await Booking.findByPk(id, {
      include: [
        { model: MeetingRoom, as: 'Room' },
        { model: User, as: 'User', attributes: { exclude: ['password_hash'] } },
        { model: BookingStatus, as: 'Status' },
        { model: User, as: 'Approver', attributes: ['id', 'first_name', 'last_name'] },
        { model: BookingParticipant, as: 'Participants' },
        { model: BookingEquipment, as: 'BookingEquipments', include: [{ model: Equipment, as: 'Equipment' }] },
        { model: FoodOrder, as: 'FoodOrder', include: [{ model: FoodOrderDiner, as: 'Diners' }, { model: User, as: 'FoodApprover', attributes: ['id', 'first_name', 'last_name'] }] },
      ],
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };
    return booking;
  }

  static async getUpcomingSchedule(roomId: number) {
    const activeStatuses = await BookingStatus.findAll({
      where: { status_code: { [Op.in]: ['approved'] } }
    });
    const statusIds = activeStatuses.map(s => s.id);
    
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const dateStr = today.toISOString().split('T')[0];

    const bookings = await Booking.findAll({
      where: {
        room_id: roomId,
        booking_date: { [Op.gte]: dateStr },
        status_id: { [Op.in]: statusIds }
      },
      attributes: ['booking_date', 'start_time', 'end_time', 'guest_name', 'guest_phone', 'booking_name', 'user_id'],
      include: [
        { model: BookingStatus, as: 'Status', attributes: ['status_code', 'status_name'] }, 
        { model: User, as: 'User', attributes: ['first_name', 'last_name', 'mobile_phone', 'office_phone'] }
      ],
      order: [['booking_date', 'ASC'], ['start_time', 'ASC']],
      limit: 20
    });

    return bookings;
  }

  static async create(data: any, userId?: number) {
    // Validate room exists
    const room = await MeetingRoom.findByPk(data.room_id, {
      include: [{ model: User, as: 'Owners' }]
    });
    if (!room || !room.is_active) throw { statusCode: 404, message: 'Room not found or inactive' };

    // Validate capacity
    if (data.participant_count > room.capacity) {
      throw { statusCode: 400, message: `Room capacity (${room.capacity}) exceeded` };
    }

    // Validate time
    if (data.start_time >= data.end_time) {
      throw { statusCode: 400, message: 'End time must be after start time' };
    }

    // Build list of booking dates (single-day or multi-day range)
    const startDateStr = String(data.booking_date).slice(0, 10);
    const endDateStr = data.end_date ? String(data.end_date).slice(0, 10) : startDateStr;
    if (endDateStr < startDateStr) {
      throw { statusCode: 400, message: 'วันสิ้นสุดการจองต้องไม่น้อยกว่าวันเริ่มต้น' };
    }

    const startObj = new Date(`${startDateStr}T00:00:00Z`);
    const endObj = new Date(`${endDateStr}T00:00:00Z`);
    const diffDays = Math.round((endObj.getTime() - startObj.getTime()) / 86400000);
    if (diffDays > 31) {
      throw { statusCode: 400, message: 'สามารถจองต่อเนื่องได้สูงสุดไม่เกิน 31 วันต่อครั้ง' };
    }

    const skipWeekends = data.skip_weekends !== undefined ? Boolean(data.skip_weekends) : false;
    const targetDates: string[] = [];
    for (let i = 0; i <= diffDays; i++) {
      const cur = new Date(startObj.getTime() + i * 86400000);
      const dayOfWeek = cur.getUTCDay();
      if (diffDays > 0 && skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }
      targetDates.push(cur.toISOString().slice(0, 10));
    }

    if (targetDates.length === 0) {
      throw { statusCode: 400, message: 'ไม่มีวันที่สามารถจองได้ในช่วงที่เลือก (ตรงกับวันเสาร์-อาทิตย์ทั้งหมด)' };
    }

    // Pre-validate time conflicts and holidays across all selected dates before creating any record
    for (const dateStr of targetDates) {
      await this.checkTimeConflict(data.room_id, dateStr, data.start_time, data.end_time);
      await this.checkHoliday(dateStr);
    }

    // Get statuses
    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    if (!pendingStatus || !approvedStatus) throw { statusCode: 500, message: 'Booking statuses not configured' };

    const initialStatusId = room.auto_approve ? approvedStatus.id : pendingStatus.id;
    const equipmentStatus = (data.additional_equipments && data.additional_equipments.length > 0) ? 'pending' : 'none';
    const user = userId ? await User.findByPk(userId) : null;

    const createdBookings: Booking[] = [];

    for (const dateStr of targetDates) {
      const booking = await Booking.create({
        ...data,
        booking_date: dateStr,
        booking_no: generateBookingNo(),
        user_id: userId,
        status_id: initialStatusId,
        is_guest_booking: data.is_guest_booking !== undefined ? Boolean(data.is_guest_booking) : !userId,
        equipment_status: equipmentStatus,
      });

      // Create participants if provided
      if (data.participants && Array.isArray(data.participants)) {
        for (const p of data.participants) {
          await BookingParticipant.create({ ...p, booking_id: booking.id });
        }
      }

      // Create food order if provided
      if (data.food_order && data.food_order.has_food_order) {
        const fo = data.food_order;
        const foodOrder = await FoodOrder.create({
          booking_id: booking.id,
          company_name: fo.company_name || '',
          customer_company: fo.customer_company || '',
          internal_companies: fo.internal_companies ? JSON.stringify(fo.internal_companies) : '[]',
          welcome_sign_needed: fo.welcome_sign_needed || false,
          welcome_sign_text: fo.welcome_sign_text || '',
          breakfast_time: fo.breakfast_time || '',
          breakfast_items: fo.breakfast_items ? JSON.stringify(fo.breakfast_items) : '[]',
          lunch_time: fo.lunch_time || '',
          lunch_items: fo.lunch_items ? JSON.stringify(fo.lunch_items) : '[]',
          afternoon_time: fo.afternoon_time || '',
          afternoon_items: fo.afternoon_items ? JSON.stringify(fo.afternoon_items) : '[]',
          snack_items: fo.snack_items ? JSON.stringify(fo.snack_items) : '[]',
          additional_notes: fo.additional_notes || '',
          remarks: fo.remarks || '',
          food_status: 'pending',
        });

        // Create guest diners
        if (fo.guest_diners && Array.isArray(fo.guest_diners)) {
          for (let i = 0; i < fo.guest_diners.length; i++) {
            const d = fo.guest_diners[i];
            if (d.diner_name && d.diner_name.trim()) {
              await FoodOrderDiner.create({
                food_order_id: foodOrder.id,
                diner_type: 'guest',
                diner_name: d.diner_name.trim(),
                sort_order: i + 1,
              });
            }
          }
        }

        // Create internal diners
        if (fo.internal_diners && Array.isArray(fo.internal_diners)) {
          for (let i = 0; i < fo.internal_diners.length; i++) {
            const d = fo.internal_diners[i];
            if (d.diner_name && d.diner_name.trim()) {
              await FoodOrderDiner.create({
                food_order_id: foodOrder.id,
                diner_type: 'internal',
                diner_name: d.diner_name.trim(),
                department: d.department || '',
                department_code: d.department_code || '',
                sort_order: i + 1,
              });
            }
          }
        }
      }

      // Create additional equipment requests
      if (data.additional_equipments && Array.isArray(data.additional_equipments)) {
        for (const eqId of data.additional_equipments) {
          await BookingEquipment.create({ booking_id: booking.id, equipment_id: eqId, quantity: 1 } as any);
        }
      }

      await logAudit('bookings', booking.id, 'CREATE', null, booking.toJSON(), userId);

      // Sync to Training System if requested
      if (data.link_training_system || booking.link_training_system) {
        const organizerName = user ? `${user.first_name} ${user.last_name}` : (data.guest_name || '');
        await syncBookingToTrainingSystem({
          natprachum_booking_id: booking.id,
          booking_no: booking.booking_no,
          booking_name: booking.booking_name,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          room_name: room.room_name,
          location: room.location,
          organizer: organizerName,
          participant_count: booking.participant_count,
          purpose: booking.purpose,
          status: 'open',
        });
      }

      createdBookings.push(booking);
    }

    const firstBooking = createdBookings[0];
    const dateLabel = targetDates.length > 1
      ? `${targetDates[0]} ถึง ${targetDates[targetDates.length - 1]} (รวม ${targetDates.length} วัน)`
      : firstBooking.booking_date;

    // Notify room owners
    const hasEquipment = data.additional_equipments && Array.isArray(data.additional_equipments) && data.additional_equipments.length > 0;
    const createChanges: string[] = [];
    if (targetDates.length > 1) {
      createChanges.push(`จองต่อเนื่อง ${targetDates.length} วัน: ${targetDates.join(', ')}`);
      createChanges.push(`รหัสการจองทั้งหมด: ${createdBookings.map((b) => b.booking_no).join(', ')}`);
    }
    if (hasEquipment) {
      createChanges.push('มีการร้องขออุปกรณ์เพิ่มเติม (Equipment Requested)');
    }

    // Check if we should send emails
    const hasFood = data.food_order && data.food_order.has_food_order;
    const shouldSendEmail = !room.auto_approve || hasEquipment || hasFood;

    if (room.Owners && room.Owners.length > 0) {
      for (const owner of room.Owners) {
        await createNotification(
          owner.id,
          'New Booking Request',
          `New booking "${data.booking_name}" for room "${room.room_name}" on ${dateLabel}${hasEquipment ? ' (มีการขออุปกรณ์เพิ่ม)' : ''}`,
          'booking',
          firstBooking.id,
          'booking'
        );
        if (owner.email && shouldSendEmail) {
          await sendBookingNotification(owner.email, data.booking_name, room.room_name, 'created', dateLabel, data.start_time, data.end_time, owner.id, createChanges, firstBooking.id);
        }
      }
    }

    // Send email to user
    const email = user?.email || data.guest_email;
    if (email) {
      const userChanges = targetDates.length > 1 ? createChanges : undefined;
      if (shouldSendEmail) {
        await sendBookingNotification(email, data.booking_name, room.room_name, 'created', dateLabel, data.start_time, data.end_time, userId, userChanges, firstBooking.id);
      } else if (room.auto_approve) {
        await sendBookingNotification(email, data.booking_name, room.room_name, 'approved', dateLabel, data.start_time, data.end_time, userId, userChanges, firstBooking.id);
      }
    }

    const firstResult = await this.getById(firstBooking.id);
    if (createdBookings.length > 1) {
      const json: any = firstResult.toJSON();
      json.created_count = createdBookings.length;
      json.created_dates = targetDates;
      json.created_booking_nos = createdBookings.map((b) => b.booking_no);
      return json;
    }
    return firstResult;
  }

  static async update(id: number, data: any, userId?: number, roleName?: string, guestEmail?: string) {
    const booking = await Booking.findByPk(id, { include: [{ model: BookingEquipment, as: 'BookingEquipments' }] });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    if (roleName !== 'SuperAdmin' && roleName !== 'Admin' && !this.isBookingOwner(booking, userId, guestEmail)) {
      throw { statusCode: 403, message: 'You do not have permission to edit this booking' };
    }

    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    
    if (booking.status_id !== pendingStatus?.id && booking.status_id !== approvedStatus?.id) {
      throw { statusCode: 400, message: 'Can only edit pending or approved bookings' };
    }

    const isApproved = booking.status_id === approvedStatus?.id;
    let bookingChanges: string[] = [];

    // Always check time conflict if times changed
    if (data.start_time && data.end_time && data.booking_date) {
      if (data.start_time !== booking.start_time || data.end_time !== booking.end_time || data.booking_date !== booking.booking_date || data.room_id !== booking.room_id) {
        await this.checkTimeConflict(data.room_id || booking.room_id, data.booking_date, data.start_time, data.end_time, id);
      }
    }

    if (isApproved) {
      if (data.booking_date && data.booking_date !== booking.booking_date) {
        bookingChanges.push(`วันที่จอง: ${booking.booking_date} -> ${data.booking_date}`);
      }
      if (data.start_time || data.end_time) {
        const oldStart = booking.start_time.substring(0, 5);
        const newStart = (data.start_time || booking.start_time).substring(0, 5);
        const oldEnd = booking.end_time.substring(0, 5);
        const newEnd = (data.end_time || booking.end_time).substring(0, 5);
        if (oldStart !== newStart || oldEnd !== newEnd) {
          bookingChanges.push(`เวลาจอง: ${oldStart} - ${oldEnd} -> ${newStart} - ${newEnd}`);
        }
      }
      if (data.room_id && data.room_id !== booking.room_id) {
        const oldRoom = await MeetingRoom.findByPk(booking.room_id);
        const newRoom = await MeetingRoom.findByPk(data.room_id);
        bookingChanges.push(`ห้องประชุม: ${oldRoom?.room_name || booking.room_id} -> ${newRoom?.room_name || data.room_id}`);
      }
      if (data.booking_name && data.booking_name !== booking.booking_name) {
        bookingChanges.push(`หัวข้อการประชุม: "${booking.booking_name}" -> "${data.booking_name}"`);
      }
      if (data.participant_count && data.participant_count !== booking.participant_count) {
        bookingChanges.push(`จำนวนผู้เข้าร่วม: ${booking.participant_count} -> ${data.participant_count}`);
      }
    }

    const oldData = booking.toJSON();
    await booking.update(data);
    let foodChanges: string[] = [];

    if (data.food_order && data.food_order.has_food_order) {
      const fo = data.food_order;
      let foodOrder = await FoodOrder.findOne({ 
        where: { booking_id: id },
        include: [{ model: FoodOrderDiner, as: 'Diners' }]
      });
      
      const foData: any = {
        company_name: fo.company_name || '',
        customer_company: fo.customer_company || '',
        internal_companies: fo.internal_companies ? JSON.stringify(fo.internal_companies) : '[]',
        welcome_sign_needed: fo.welcome_sign_needed || false,
        welcome_sign_text: fo.welcome_sign_text || '',
        breakfast_time: fo.breakfast_time || '',
        breakfast_items: fo.breakfast_items ? JSON.stringify(fo.breakfast_items) : '[]',
        lunch_time: fo.lunch_time || '',
        lunch_items: fo.lunch_items ? JSON.stringify(fo.lunch_items) : '[]',
        afternoon_time: fo.afternoon_time || '',
        afternoon_items: fo.afternoon_items ? JSON.stringify(fo.afternoon_items) : '[]',
        snack_items: fo.snack_items ? JSON.stringify(fo.snack_items) : '[]',
        additional_notes: fo.additional_notes || '',
        remarks: fo.remarks || '',
      };

      if (foodOrder) {
        if (isApproved) {
          if (foodOrder.company_name !== foData.company_name) foodChanges.push('บริษัทผู้จัดทำ');
          if (foodOrder.welcome_sign_needed !== foData.welcome_sign_needed || foodOrder.welcome_sign_text !== foData.welcome_sign_text) foodChanges.push('ป้ายต้อนรับ');
          if (foodOrder.breakfast_time !== foData.breakfast_time || foodOrder.breakfast_items !== foData.breakfast_items) foodChanges.push('อาหารเช้า (Breakfast)');
          if (foodOrder.lunch_time !== foData.lunch_time || foodOrder.lunch_items !== foData.lunch_items) foodChanges.push('อาหารกลางวัน (Lunch)');
          if (foodOrder.afternoon_time !== foData.afternoon_time || foodOrder.afternoon_items !== foData.afternoon_items) foodChanges.push('อาหารว่างบ่าย (Afternoon Snack)');
          if (foodOrder.additional_notes !== foData.additional_notes || foodOrder.remarks !== foData.remarks) foodChanges.push('หมายเหตุ / รายการเพิ่มเติม');
          
          const oldGuests = (foodOrder as any).Diners?.filter((d: any) => d.diner_type === 'guest').map((d: any) => d.diner_name).sort().join(',') || '';
          const newGuests = (fo.guest_diners || []).filter((d: any) => d.diner_name?.trim()).map((d: any) => d.diner_name.trim()).sort().join(',');
          const oldInternals = (foodOrder as any).Diners?.filter((d: any) => d.diner_type === 'internal').map((d: any) => d.diner_name).sort().join(',') || '';
          const newInternals = (fo.internal_diners || []).filter((d: any) => d.diner_name?.trim()).map((d: any) => d.diner_name.trim()).sort().join(',');
          
          if (oldGuests !== newGuests || oldInternals !== newInternals) {
            foodChanges.push('รายชื่อผู้รับประทานอาหาร');
          }
          
          if (foodChanges.length > 0) {
            foData.food_status = 'pending';
            foData.food_edit_details = JSON.stringify(foodChanges);
          } else {
            foData.food_status = foodOrder.food_status;
          }
        }
        await foodOrder.update(foData);
        await FoodOrderDiner.destroy({ where: { food_order_id: foodOrder.id }, force: true });
      } else {
        foodOrder = await FoodOrder.create({
          ...foData,
          booking_id: id,
          food_status: 'pending',
        });
        if (isApproved) {
          foodChanges.push('เพิ่มการสั่งอาหารใหม่ (Added New Food Order)');
        }
      }

      if (fo.guest_diners && Array.isArray(fo.guest_diners)) {
        for (let i = 0; i < fo.guest_diners.length; i++) {
          const d = fo.guest_diners[i];
          if (d.diner_name && d.diner_name.trim()) {
            await FoodOrderDiner.create({ food_order_id: foodOrder.id, diner_type: 'guest', diner_name: d.diner_name.trim(), department: d.department || '', sort_order: i + 1 });
          }
        }
      }
      if (fo.internal_diners && Array.isArray(fo.internal_diners)) {
        for (let i = 0; i < fo.internal_diners.length; i++) {
          const d = fo.internal_diners[i];
          if (d.diner_name && d.diner_name.trim()) {
            await FoodOrderDiner.create({ food_order_id: foodOrder.id, diner_type: 'internal', diner_name: d.diner_name.trim(), department: d.department || '', department_code: d.department_code || '', sort_order: i + 1 });
          }
        }
      }
    } else if (data.hasOwnProperty('food_order')) {
      // If food_order is explicitly sent as null or has_food_order is false, remove existing
      const existingFoodOrder = await FoodOrder.findOne({ where: { booking_id: id } });
      if (existingFoodOrder) {
        if (existingFoodOrder.payment_ref_id) {
          try {
            const refId = existingFoodOrder.payment_ref_id;
            await updatePaymentStatus(refId, `ผู้ใช้ยกเลิกการสั่งอาหารในใบจองห้องประชุมเลขที่: ${(booking as any).booking_no}`);
          } catch (err) {
            console.error('Error integrating with Payment System for cancellation on food removal:', err);
          }
        }
        await FoodOrder.destroy({ where: { booking_id: id }, force: true });
        if (isApproved) {
          foodChanges.push('ยกเลิกการสั่งอาหาร (Cancelled Food Order)');
        }
      }
    }

    let equipmentChanged = false;
    let equipmentChanges: string[] = [];

    if (data.additional_equipments && Array.isArray(data.additional_equipments)) {
      const oldEqs = (booking as any).BookingEquipments?.map((e: any) => e.equipment_id.toString()).sort().join(',') || '';
      const newEqs = [...data.additional_equipments].map(String).sort().join(',');
      
      if (oldEqs !== newEqs) {
        equipmentChanged = true;
        let newEqNamesStr = 'ไม่มี (None)';
        if (data.additional_equipments.length > 0) {
          const newEqDocs = await Equipment.findAll({ where: { id: { [Op.in]: data.additional_equipments } } });
          newEqNamesStr = newEqDocs.map((eq: any) => eq.equipment_name).join(', ');
        }
        equipmentChanges.push(`อัปเดตอุปกรณ์: เปลี่ยนเป็น [${newEqNamesStr}]`);
      }

      await BookingEquipment.destroy({ where: { booking_id: id }, force: true });
      for (const eqId of data.additional_equipments) {
        await BookingEquipment.create({ booking_id: id, equipment_id: eqId, quantity: 1 } as any);
      }
    }

    const hasCoreChanges = bookingChanges.length > 0 || equipmentChanged;

    if (hasCoreChanges) {
      const currentNotes = booking.edit_notes ? booking.edit_notes + '\n' : '';
      await booking.update({ 
        equipment_status: equipmentChanged ? (data.additional_equipments?.length > 0 ? 'pending' : 'none') : booking.equipment_status,
        edit_notes: currentNotes + [...bookingChanges, ...equipmentChanges].join('\n')
      });
      
      // Notify owners of the change (no re-approval needed for the room)
      const room = await MeetingRoom.findByPk(booking.room_id, {
        include: [{ model: User, as: 'Owners' }]
      });
      if (room?.Owners) {
        for (const owner of room.Owners) {
          await createNotification(
            owner.id,
            'Booking Edited',
            `Booking "${booking.booking_name}" was edited. Changes: ${[...bookingChanges, ...equipmentChanges, ...foodChanges].join(', ')}`,
            'booking',
            booking.id,
            'booking'
          );
          if (owner.email) {
            await sendBookingNotification(owner.email, booking.booking_name, room.room_name, 'updated', booking.booking_date, booking.start_time, booking.end_time, userId, [...bookingChanges, ...equipmentChanges, ...foodChanges], booking.id);
          }
        }
      }
    } else if (isApproved && foodChanges.length > 0) {
      const room = await MeetingRoom.findByPk(booking.room_id, {
        include: [{ model: User, as: 'Owners' }]
      });
      if (room?.Owners) {
        for (const owner of room.Owners) {
          await sendBookingNotification(owner.email, booking.booking_name, room.room_name, 'food_updated', booking.booking_date, booking.start_time, booking.end_time, userId, foodChanges, booking.id);
        }
      }
    }

    await logAudit('bookings', id, 'UPDATE', oldData, booking.toJSON(), userId);

    if (booking.link_training_system || data.link_training_system) {
      const updatedRoom = await MeetingRoom.findByPk(booking.room_id);
      const bookerUser = booking.user_id ? await User.findByPk(booking.user_id) : null;
      const organizerName = bookerUser ? `${bookerUser.first_name} ${bookerUser.last_name}` : (booking.guest_name || '');
      await syncBookingToTrainingSystem({
        natprachum_booking_id: booking.id,
        booking_no: booking.booking_no,
        booking_name: booking.booking_name,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        room_name: updatedRoom?.room_name,
        location: updatedRoom?.location,
        organizer: organizerName,
        participant_count: booking.participant_count,
        purpose: booking.purpose,
        status: 'open',
      });
    }

    return await this.getById(id);
  }

  static async cancel(id: number, reason: string, userId?: number, roleName?: string, guestEmail?: string) {
    const booking = await Booking.findByPk(id, { 
      include: [
        { model: MeetingRoom, as: 'Room', include: [{ model: User, as: 'Owners' }] },
        { model: FoodOrder, as: 'FoodOrder' }
      ] 
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    if (roleName !== 'SuperAdmin' && roleName !== 'Admin' && !this.isBookingOwner(booking, userId, guestEmail)) {
      throw { statusCode: 403, message: 'You do not have permission to cancel this booking' };
    }

    const cancelledStatus = await BookingStatus.findOne({ where: { status_code: 'cancelled' } });
    if (!cancelledStatus) throw { statusCode: 500, message: 'Status not configured' };

    await booking.update({ status_id: cancelledStatus.id, cancel_reason: reason });
    await logAudit('bookings', id, 'UPDATE', { status: 'active' }, { status: 'cancelled' }, userId);

    // Notify Bookee
    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'cancelled', booking.booking_date, booking.start_time, booking.end_time, userId, undefined, id);
    }
    
    // Notify Room Owners (if any)
    if (booking.Room?.Owners && Array.isArray(booking.Room.Owners)) {
      for (const owner of booking.Room.Owners) {
        if (owner.email) {
          await sendBookingNotification(owner.email, booking.booking_name, booking.Room.room_name, 'cancelled', booking.booking_date, booking.start_time, booking.end_time, userId, undefined, id);
        }
      }
    }

    // Cancel Payment System Integration if exists
    if ((booking as any).FoodOrder && (booking as any).FoodOrder.payment_ref_id) {
      try {
        const refId = (booking as any).FoodOrder.payment_ref_id;
        const reasonText = reason ? `${reason} ` : 'ผู้ใช้ยกเลิกการจองห้องประชุม ';
        await updatePaymentStatus(refId, `${reasonText}(อ้างอิง: ${(booking as any).booking_no})`);
      } catch (err) {
        console.error('Error integrating with Payment System for cancellation:', err);
      }
    }

    return await this.getById(id);
  }

  static async createGuestBooking(data: any) {
    const normalizedEmail = data.guest_email ? String(data.guest_email).trim() : '';
    let matchedUserId: number | undefined;

    if (normalizedEmail) {
      const existingUser = await User.findOne({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('email')),
          normalizedEmail.toLowerCase()
        ),
        attributes: ['id'],
      });
      if (existingUser) {
        matchedUserId = existingUser.id;
      }
    }

    return this.create(
      {
        ...data,
        guest_email: normalizedEmail,
        is_guest_booking: true,
      },
      matchedUserId
    );
  }

  static async delete(id: number, userId?: number, roleName?: string, guestEmail?: string) {
    const booking = await Booking.findByPk(id, {
      include: [{ model: FoodOrder, as: 'FoodOrder' }]
    });
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    if (roleName !== 'SuperAdmin' && roleName !== 'Admin' && !this.isBookingOwner(booking, userId, guestEmail)) {
      throw { statusCode: 403, message: 'You do not have permission to delete this booking' };
    }

    // Cancel Payment System Integration if exists
    if ((booking as any).FoodOrder && (booking as any).FoodOrder.payment_ref_id) {
      try {
        const refId = (booking as any).FoodOrder.payment_ref_id;
        await updatePaymentStatus(refId, `ผู้ใช้ลบใบจองห้องประชุม (อ้างอิง: ${(booking as any).booking_no})`);
      } catch (err) {
        console.error('Error integrating with Payment System for cancellation on delete:', err);
      }
    }

    await booking.destroy();
    return true;
  }

  private static async checkTimeConflict(roomId: number, bookingDate: string, startTime: string, endTime: string, excludeId?: number) {
    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });

    const where: any = {
      room_id: roomId,
      booking_date: bookingDate,
      status_id: { [Op.in]: [approvedStatus?.id, pendingStatus?.id].filter(Boolean) },
      [Op.or]: [
        { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
      ],
    };

    if (excludeId) where.id = { [Op.ne]: excludeId };

    const conflict = await Booking.findOne({ where });
    if (conflict) {
      throw { statusCode: 409, message: `มีการจองห้องในวันที่ ${bookingDate} เวลาดังกล่าวแล้ว (${conflict.booking_no})` };
    }
  }

  private static async checkHoliday(bookingDate: string) {
    const holiday = await CompanyHoliday.findOne({
      where: { holiday_date: bookingDate, allow_special_approval: false },
    });
    if (holiday) {
      throw { statusCode: 400, message: `ไม่สามารถจองในวันหยุดบริษัท (${bookingDate}: ${holiday.holiday_name})` };
    }
  }
}
