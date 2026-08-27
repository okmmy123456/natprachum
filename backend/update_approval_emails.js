const fs = require('fs');

let content = fs.readFileSync('backend/src/services/approval.service.ts', 'utf-8');

// Replace the block in approve method
const approveTarget = `    if (!booking.is_guest_booking) {
      const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
      const email = user?.email || booking.guest_email;
      if (email) {
        await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'approved', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined);
      }
    }`;
const approveReplacement = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'approved', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }`;
content = content.replace(approveTarget, approveReplacement);

// Replace the block in reject method
const rejectTarget = `    if (!booking.is_guest_booking) {
      const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
      const email = user?.email || booking.guest_email;
      if (email) {
        await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'rejected', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined);
      }
    }`;
const rejectReplacement = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'rejected', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }`;
content = content.replace(rejectTarget, rejectReplacement);

fs.writeFileSync('backend/src/services/approval.service.ts', content);
console.log('approval.service.ts updated');
