import { mailConfig } from '../config/mail';
import { EmailLog, Booking, BookingStatus, FoodOrder, BookingEquipment } from '../models';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  type: string;
  user_id?: number;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const { to, subject, html, type, user_id } = options;

  try {

    await mailConfig.transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      html,
    });

    await EmailLog.create({
      user_id,
      to_email: to,
      subject,
      body: html,
      type,
      status: 'sent',
    });

    return true;
  } catch (error: any) {
    console.error('Email send failed:', error.message);

    await EmailLog.create({
      user_id,
      to_email: to,
      subject,
      body: html,
      type,
      status: 'failed',
      error_message: error.message,
    });

    return false;
  }
};

export const sendOTPEmail = async (email: string, otpCode: string, type: string, userId?: number): Promise<boolean> => {
  const subject = type === 'register' ? 'NatPrachum TCI - Email Verification' :
                  type === 'forgot_password' ? 'NatPrachum TCI - Password Reset' :
                  'NatPrachum TCI - Email Change Verification';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">NatPrachum TCI</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">Meeting Room Booking System</p>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Your Verification Code</h2>
        <p style="color: #6b7280;">Please use the following OTP code to verify your ${type === 'register' ? 'email address' : type === 'forgot_password' ? 'password reset' : 'email change'}:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otpCode}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html, type: `otp_${type}`, user_id: userId });
};

export const sendBookingNotification = async (
  email: string,
  bookingName: string,
  roomName: string,
  status: string,
  bookingDate: string,
  startTime: string,
  endTime: string,
  userId?: number,
  changes?: string[],
  bookingId?: number
): Promise<boolean> => {
  const statusColors: Record<string, string> = {
    created: '#3B82F6',
    approved: '#10B981',
    rejected: '#EF4444',
    cancelled: '#6B7280',
    food_updated: '#F59E0B',
    updated: '#3B82F6',
  };

  let title = '';
  if (status === 'created') title = 'สร้างการจองห้องประชุมใหม่';
  else if (status === 'updated') title = 'แก้ไขการจองห้องประชุม';
  else if (status === 'cancelled') title = 'ยกเลิกการจองห้องประชุม';
  else if (status === 'approved') title = 'อนุมัติการจองห้องประชุม';
  else if (status === 'rejected') title = 'ไม่อนุมัติการจองห้องประชุม';
  else if (status === 'food_updated') title = 'มีการแก้ไขใบจองอาหาร';
  else title = `สถานะการจอง: ${status}`;

  const displayStatus = status === 'food_updated' ? 'แก้ไขใบจองอาหาร' : status.toUpperCase();

  let roomStatusStr = displayStatus;
  let equipmentStatusStr = 'ไม่มีการร้องขอ';
  let foodStatusStr = 'ไม่มีการร้องขอ';
  let bookingNoStr = '-';

  if (bookingId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: BookingStatus, as: 'Status' },
        { model: BookingEquipment, as: 'BookingEquipments' },
        { model: FoodOrder, as: 'FoodOrder' }
      ]
    });

    if (booking) { const b = booking as any;
      bookingNoStr = b.booking_no || '-';
      // Room Status
      if (b.Status?.status_name) {
        const s = b.Status.status_name.toLowerCase();
        if (s.includes('pending')) roomStatusStr = 'รอการอนุมัติ';
        else if (s.includes('approve')) roomStatusStr = 'อนุมัติ';
        else if (s.includes('reject')) roomStatusStr = 'ไม่อนุมัติ';
        else if (s.includes('cancel')) roomStatusStr = 'ยกเลิก';
        else roomStatusStr = b.Status.status_name;
      }

      // Equipment Status
      if (b.equipment_status) {
        if (b.equipment_status === 'none') equipmentStatusStr = 'ไม่มีการร้องขอ';
        else if (b.equipment_status === 'pending') equipmentStatusStr = 'รอการอนุมัติ (ร้องขออุปกรณ์)';
        else if (b.equipment_status === 'approved') equipmentStatusStr = 'อนุมัติ';
        else if (b.equipment_status === 'rejected') equipmentStatusStr = 'ไม่อนุมัติ';
      } else {
        equipmentStatusStr = 'ไม่มีการร้องขอ';
      }

      // Food Status
      if (b.FoodOrder) {
        const fs = b.FoodOrder.food_status?.toLowerCase() || '';
        if (fs === 'pending') foodStatusStr = 'รออนุมัติ';
        else if (fs === 'approved') foodStatusStr = 'อนุมัติ';
        else if (fs === 'rejected') foodStatusStr = 'ไม่อนุมัติ';
        else if (fs === 'cancelled') foodStatusStr = 'ยกเลิก';
        else if (fs === 'revised') foodStatusStr = 'มีการแก้ไข';
        else foodStatusStr = b.FoodOrder.food_status;
      }
    }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">NatPrachum TCI</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">${title}</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColors[status] || '#6B7280'}; font-size: 14pt;">
          <p><strong>Booking No:</strong> ${bookingNoStr}</p>
          <p><strong>Booking:</strong> ${bookingName}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Date:</strong> ${bookingDate}</p>
          <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
          <p><strong>สถานะห้องประชุม:</strong> <span style="color: ${statusColors[status] || '#6B7280'}; font-weight: bold;">${roomStatusStr}</span></p>
          <p><strong>สถานะการร้องขออุปกรณ์:</strong> ${equipmentStatusStr}</p>
          <p><strong>สถานะการจองอาหาร:</strong> ${foodStatusStr}</p>
          ${changes && changes.length > 0 ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #d1d5db;">
            <p style="margin-top: 0;"><strong>รายการที่ถูกแก้ไข/เพิ่มเติม:</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
              ${changes.map(c => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `NatPrachum TCI - ${title}`,
    html,
    type: `booking_${status}`,
    user_id: userId,
  });
};

export const sendAutoApproveOwnerNotification = async (
  ownerEmail: string,
  booking: any,
  autoApprovedItems: string[],
  ownerUserId?: number
): Promise<boolean> => {
  const roomName = booking.Room?.room_name || '-';
  const roomLocation = booking.Room?.location ? ` (${booking.Room.location})` : '';
  const bookerName = booking.is_guest_booking
    ? `${booking.guest_name || '-'} (Guest)`
    : `${booking.User?.first_name || ''} ${booking.User?.last_name || ''}`.trim() || '-';
  const bookerEmail = booking.is_guest_booking ? (booking.guest_email || '-') : (booking.User?.email || '-');
  const bookerPhone = booking.is_guest_booking
    ? (booking.guest_phone || '-')
    : (booking.phone_number || booking.User?.mobile_phone || booking.User?.office_phone || '-');
  const startTime = String(booking.start_time || '').slice(0, 5);
  const endTime = String(booking.end_time || '').slice(0, 5);
  const eqList = Array.isArray(booking.BookingEquipments) && booking.BookingEquipments.length > 0
    ? booking.BookingEquipments.map((eq: any) => eq.Equipment?.equipment_name || 'ไม่ระบุ').join(', ')
    : 'ไม่มี';

  const title = `แจ้งเตือนการอนุมัติอัตโนมัติ (เลยกำหนดวันประชุม 3 วัน)`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">NatPrachum TCI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0;">ระบบอนุมัติการจองห้องประชุมและอุปกรณ์อัตโนมัติ</p>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <h2 style="color: #b45309; margin-top: 0;">${title}</h2>
        <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong>สาเหตุ:</strong> เนื่องจากเลยกำหนดวันที่ประชุมมาแล้วเกิน 3 วัน โดยยังไม่ได้ดำเนินการอนุมัติ ระบบจึงทำการ <strong>อนุมัติอัตโนมัติ (Auto-Approved)</strong> ตามเงื่อนไขของระบบ
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #10B981; font-size: 14px; line-height: 1.7;">
          <p style="margin: 4px 0;"><strong>รายการที่ระบบอนุมัติอัตโนมัติ:</strong> <span style="color: #059669; font-weight: bold;">${autoApprovedItems.join(', ')}</span></p>
          <hr style="border: none; border-top: 1px dashed #d1d5db; margin: 12px 0;" />
          <p style="margin: 4px 0;"><strong>รหัสการจอง (Booking No):</strong> ${booking.booking_no || '-'}</p>
          <p style="margin: 4px 0;"><strong>หัวข้อการประชุม:</strong> ${booking.booking_name || '-'}</p>
          <p style="margin: 4px 0;"><strong>ห้องประชุม:</strong> ${roomName}${roomLocation}</p>
          <p style="margin: 4px 0;"><strong>วันที่ประชุม:</strong> ${booking.booking_date || '-'}</p>
          <p style="margin: 4px 0;"><strong>เวลา:</strong> ${startTime} - ${endTime}</p>
          <p style="margin: 4px 0;"><strong>ผู้จอง:</strong> ${bookerName}</p>
          <p style="margin: 4px 0;"><strong>อีเมลผู้จอง:</strong> ${bookerEmail}</p>
          <p style="margin: 4px 0;"><strong>เบอร์โทรศัพท์:</strong> ${bookerPhone}</p>
          <p style="margin: 4px 0;"><strong>จำนวนผู้เข้าร่วม:</strong> ${booking.participant_count || '-'} คน</p>
          <p style="margin: 4px 0;"><strong>วัตถุประสงค์:</strong> ${booking.purpose || '-'}</p>
          <p style="margin: 4px 0;"><strong>อุปกรณ์เสริมที่ขอเพิ่ม:</strong> ${eqList}</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `NatPrachum TCI - ${title} [${booking.booking_no}]`,
    html,
    type: 'booking_auto_approved',
    user_id: ownerUserId,
  });
};
