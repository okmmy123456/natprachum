const fs = require('fs');

let content = fs.readFileSync('backend/src/services/approval.service.ts', 'utf-8');

// 1. In `approve` and `reject` method, we need to add the Owners include:
content = content.replace(
  /const booking = await Booking\.findByPk\(bookingId, \{\r?\n      include: \[\{ model: MeetingRoom, as: 'Room' \}\],\r?\n    \}\);/g,
  `const booking = await Booking.findByPk(bookingId, {
      include: [{ model: MeetingRoom, as: 'Room', include: [{ model: User, as: 'Owners' }] }],
    });`
);

// 2. Add email to owners in `approve`
const approveEmailBlock = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'approved', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }`;
const approveEmailBlockWithOwners = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'approved', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }
    
    // Notify room owners
    if (booking.Room && (booking.Room as any).Owners && (booking.Room as any).Owners.length > 0) {
      for (const owner of (booking.Room as any).Owners) {
        if (owner.email) {
          await sendBookingNotification(owner.email, booking.booking_name, booking.Room?.room_name || '', 'approved', booking.booking_date, booking.start_time, booking.end_time, owner.id, undefined, bookingId);
        }
      }
    }`;
content = content.replace(approveEmailBlock, approveEmailBlockWithOwners);

// 3. Add email to owners in `reject`
const rejectEmailBlock = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'rejected', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }`;
const rejectEmailBlockWithOwners = `    const user = booking.user_id ? await User.findByPk(booking.user_id) : null;
    const email = user?.email || booking.guest_email;
    if (email) {
      await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'rejected', booking.booking_date, booking.start_time, booking.end_time, booking.user_id || undefined, undefined, bookingId);
    }
    
    // Notify room owners
    if (booking.Room && (booking.Room as any).Owners && (booking.Room as any).Owners.length > 0) {
      for (const owner of (booking.Room as any).Owners) {
        if (owner.email) {
          await sendBookingNotification(owner.email, booking.booking_name, booking.Room?.room_name || '', 'rejected', booking.booking_date, booking.start_time, booking.end_time, owner.id, undefined, bookingId);
        }
      }
    }`;
content = content.replace(rejectEmailBlock, rejectEmailBlockWithOwners);

// Also we need to make sure User model is imported at the top of approval.service.ts
if (!content.includes(`import { User `) && !content.includes(`User,`)) {
  content = content.replace(
    /import \{ Booking, MeetingRoom, BookingStatus \} from '\.\.\/models';/,
    `import { Booking, MeetingRoom, BookingStatus, User } from '../models';`
  );
}

fs.writeFileSync('backend/src/services/approval.service.ts', content);
console.log('approval.service.ts updated with owners notification');
