import { Op } from 'sequelize';
import { Booking, BookingStatus, FoodOrder, FoodOrderDiner, MeetingRoom, User, Company } from '../models';
import { logAudit } from './auditlog.service';
import { createNotification } from './notification.service';
import { sendBookingNotification } from './email.service';
import { updatePaymentStatus } from '../utils/payment.util';

export class FoodOrderService {
  /**
   * Create a food order for a booking
   */
  static async createForBooking(bookingId: number, data: any, userId?: number) {
    // Verify booking exists
    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw { statusCode: 404, message: 'Booking not found' };

    // Check if food order already exists for this booking
    const existing = await FoodOrder.findOne({ where: { booking_id: bookingId } });
    if (existing) throw { statusCode: 400, message: 'Food order already exists for this booking' };

    const foodOrder = await FoodOrder.create({
      booking_id: bookingId,
      company_name: data.company_name || '',
      welcome_sign_needed: data.welcome_sign_needed || false,
      welcome_sign_text: data.welcome_sign_text || '',
      snack_items: data.snack_items ? JSON.stringify(data.snack_items) : '[]',
      lunch_items: data.lunch_items ? JSON.stringify(data.lunch_items) : '[]',
      additional_notes: data.additional_notes || '',
      remarks: data.remarks || '',
      food_status: 'pending',
    });

    // Create diners
    if (data.guest_diners && Array.isArray(data.guest_diners)) {
      for (let i = 0; i < data.guest_diners.length; i++) {
        const d = data.guest_diners[i];
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

    if (data.internal_diners && Array.isArray(data.internal_diners)) {
      for (let i = 0; i < data.internal_diners.length; i++) {
        const d = data.internal_diners[i];
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

    await logAudit('food_orders', foodOrder.id, 'CREATE', null, foodOrder.toJSON(), userId);

    return await this.getByBookingId(bookingId);
  }

  /**
   * Get food order by booking ID
   */
  static async getByBookingId(bookingId: number) {
    const foodOrder = await FoodOrder.findOne({
      where: { booking_id: bookingId },
      include: [
        { model: FoodOrderDiner, as: 'Diners', order: [['sort_order', 'ASC']] },
        { model: User, as: 'FoodApprover', attributes: ['id', 'first_name', 'last_name'] },
      ],
    });
    return foodOrder;
  }

  /**
   * Get all pending food orders (for Manager/Admin approval)
   */
  static async getPending(userId: number, roleCode: string) {
    const where: any = { food_status: 'pending' };

    const foodOrders = await FoodOrder.findAll({
      where,
      include: [
        {
          model: Booking,
          as: 'Booking',
          include: [
            { model: MeetingRoom, as: 'Room', attributes: ['id', 'room_name', 'location'] },
            { model: User, as: 'User', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: BookingStatus, as: 'Status' },
          ],
        },
        { model: FoodOrderDiner, as: 'Diners' },
        { model: User, as: 'FoodApprover', attributes: ['id', 'first_name', 'last_name'] },
      ],
      order: [['created_at', 'ASC']],
    });

    return foodOrders;
  }

  /**
   * Approve a food order
   */
  static async approve(foodOrderId: number, approvedBy: number) {
    const foodOrder = await FoodOrder.findByPk(foodOrderId, {
      include: [
        {
          model: Booking,
          as: 'Booking',
          include: [{ model: MeetingRoom, as: 'Room' }, { model: User, as: 'User' }],
        },
      ],
    });
    if (!foodOrder) throw { statusCode: 404, message: 'Food order not found' };

    if (foodOrder.food_status !== 'pending') {
      throw { statusCode: 400, message: 'Can only approve pending food orders' };
    }

    await foodOrder.update({
      food_status: 'approved',
      food_approved_by: approvedBy,
      food_approved_at: new Date(),
    });

    await logAudit('food_orders', foodOrderId, 'UPDATE', { food_status: 'pending' }, { food_status: 'approved' }, approvedBy);

    // Notify the booking creator
    const booking = foodOrder.Booking;
    if (booking?.user_id) {
      await createNotification(
        booking.user_id,
        'อนุมัติจองอาหาร',
        `คำขอจองอาหารสำหรับ "${booking.booking_name}" ได้รับการอนุมัติแล้ว`,
        'success',
        booking.id,
        'booking'
      );
      if (booking.User?.email) {
        await sendBookingNotification(
          booking.User.email, 
          booking.booking_name, 
          booking.Room?.room_name || '-', 
          'approved', 
          booking.booking_date, 
          booking.start_time, 
          booking.end_time, 
          approvedBy, 
          [], 
          booking.id
        );
      }
    }

    // --- Payment System Integration ---
    try {
      let targetUserId = approvedBy;
      const paymentCreatorType = booking?.Room?.payment_creator_type || 'approver';
      
      if (paymentCreatorType === 'owner' && booking?.Room?.owner_id) {
        targetUserId = booking.Room.owner_id;
      }

      const paymentUser = await User.findByPk(targetUserId, {
        include: [{ model: Company, as: 'Company' }]
      });

      if (paymentUser) {
        // If there's an existing payment_ref_id, cancel it first before generating a new one
          if (foodOrder.payment_ref_id) {
            try {
              const oldRef = foodOrder.payment_ref_id;
              const bookingNo = (foodOrder as any).Booking?.booking_no || '-';
              await updatePaymentStatus(oldRef, `ผู้ใช้อนุมัติรายการอาหารที่แก้ไขใหม่ (Void and Re-create) - อ้างอิง: ${bookingNo}`);
            } catch (cancelErr) {
            console.error('Error cancelling old payment document:', cancelErr);
          }
        }

        const payload: any = {
          date: booking?.booking_date || new Date().toISOString().slice(0, 10),
          company: (paymentUser as any).Company?.company_code || 'TCI',
          dept_name: paymentUser.department_name || '-',
          dept_code: paymentUser.department_code || '-',
          topic: `จองอาหารห้องประชุม ${booking?.Room?.room_name || ''}`,
          creator_email: paymentUser.email,
          preparer: `${paymentUser.first_name || ''} ${paymentUser.last_name || ''}`.trim() || paymentUser.username,
          status: 0,
          remark: [
            `อ้างอิงจากการจองห้องประชุมเลขที่: ${booking?.booking_no || '-'} (หัวข้อ: ${booking?.booking_name || '-'})`,
            `วันที่: ${booking?.booking_date || '-'} เวลา: ${booking?.start_time?.substring(0, 5) || '-'} - ${booking?.end_time?.substring(0, 5) || '-'} น.`,
            (foodOrder.breakfast_items && foodOrder.breakfast_items !== '[]') ? 'มีอาหารเช้า' : '',
            (foodOrder.lunch_items && foodOrder.lunch_items !== '[]') ? 'มีอาหารกลางวัน' : '',
            ((foodOrder.afternoon_items && foodOrder.afternoon_items !== '[]') || (foodOrder.snack_items && foodOrder.snack_items !== '[]')) ? 'มีอาหารว่าง' : ''
          ].filter(Boolean).join(', '),
          items: [
            {
              detail: 'อาหาร',
              qty: 1,
              price: 0
            }
          ]
        };

        const response = await fetch('http://localhost:5000/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error('Payment System Integration Failed with status:', response.status);
        } else {
          console.log('Successfully created document in Payment System for user:', paymentUser.email);
            try {
              const resData: any = await response.json();
              const refId = resData?.data?.doc_no || resData?.doc_no || resData?.data?.id || resData?.id;
              if (refId) {
                await foodOrder.update({ payment_ref_id: String(refId) });
                console.log('Saved payment_ref_id to food order:', refId);
              } else {
                console.log('No refId found in payment system response:', resData);
              }
            } catch (e) {
            console.log('Could not parse response from payment system or no ref ID returned.');
          }
        }
      }
    } catch (paymentErr) {
      console.error('Error integrating with Payment System:', paymentErr);
      // We don't throw the error so the food approval still succeeds
    }
    // ----------------------------------

    return foodOrder;
  }

  /**
   * Reject a food order
   */
  static async reject(foodOrderId: number, rejectedBy: number, reason: string) {
    const foodOrder = await FoodOrder.findByPk(foodOrderId, {
      include: [
        {
          model: Booking,
          as: 'Booking',
          include: [{ model: MeetingRoom, as: 'Room' }, { model: User, as: 'User' }],
        },
      ],
    });
    if (!foodOrder) throw { statusCode: 404, message: 'Food order not found' };

    if (foodOrder.food_status !== 'pending') {
      throw { statusCode: 400, message: 'Can only reject pending food orders' };
    }

    await foodOrder.update({
      food_status: 'rejected',
      food_approved_by: rejectedBy,
      food_approved_at: new Date(),
      food_reject_reason: reason,
    });

    await logAudit('food_orders', foodOrderId, 'UPDATE', { food_status: 'pending' }, { food_status: 'rejected', reason }, rejectedBy);

    // Notify the booking creator
    const booking = foodOrder.Booking;
    if (booking?.user_id) {
      await createNotification(
        booking.user_id,
        'ปฏิเสธจองอาหาร',
        `คำขอจองอาหารสำหรับ "${booking.booking_name}" ถูกปฏิเสธ เหตุผล: ${reason}`,
        'error',
        booking.id,
        'booking'
      );
      if (booking.User?.email) {
        await sendBookingNotification(
          booking.User.email, 
          booking.booking_name, 
          booking.Room?.room_name || '-', 
          'rejected', 
          booking.booking_date, 
          booking.start_time, 
          booking.end_time, 
          rejectedBy, 
          [`เหตุผลที่ไม่อนุมัติอาหาร: ${reason}`], 
          booking.id
        );
      }
    }

    return foodOrder;
  }
}
