const fs = require('fs');

async function updateBackend() {
  // 1. Update email.service.ts
  let emailContent = fs.readFileSync('backend/src/services/email.service.ts', 'utf-8');
  
  // Add models to import
  emailContent = emailContent.replace(
    /import \{ EmailLog \} from '\.\.\/models';/,
    `import { EmailLog, Booking, BookingStatus, FoodOrder, BookingEquipment } from '../models';`
  );

  // Add bookingId parameter
  emailContent = emailContent.replace(
    /userId\?: number,\r?\n  changes\?: string\[\]\r?\n\): Promise<boolean> => \{/,
    `userId?: number,\n  changes?: string[],\n  bookingId?: number\n): Promise<boolean> => {`
  );

  // Add DB fetching block before HTML generation
  const dbFetchBlock = `  const displayStatus = status === 'food_updated' ? 'FOOD UPDATED' : status.toUpperCase();

  let roomStatusStr = displayStatus;
  let equipmentStatusStr = 'ไม่มีการร้องขอ';
  let foodStatusStr = 'ไม่มีการร้องขอ';

  if (bookingId) {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: BookingStatus, as: 'Status' },
        { model: BookingEquipment, as: 'BookingEquipments' },
        { model: FoodOrder, as: 'FoodOrder' }
      ]
    });

    if (booking) {
      // Room Status
      if (booking.Status?.status_name) {
        const s = booking.Status.status_name.toLowerCase();
        if (s.includes('pending')) roomStatusStr = 'รอการอนุมัติ';
        else if (s.includes('approve')) roomStatusStr = 'อนุมัติ';
        else if (s.includes('reject')) roomStatusStr = 'ไม่อนุมัติ';
        else if (s.includes('cancel')) roomStatusStr = 'ยกเลิก';
        else roomStatusStr = booking.Status.status_name;
      }

      // Equipment Status
      const hasEq = booking.BookingEquipments && booking.BookingEquipments.length > 0;
      if (!hasEq) {
        equipmentStatusStr = 'ไม่มีการร้องขอ';
      } else {
        if (roomStatusStr === 'รอการอนุมัติ') equipmentStatusStr = 'รอการอนุมัติ (ร้องขออุปกรณ์)';
        else if (roomStatusStr === 'อนุมัติ') equipmentStatusStr = 'อนุมัติ';
        else if (roomStatusStr === 'ไม่อนุมัติ') equipmentStatusStr = 'ไม่อนุมัติ';
        else if (roomStatusStr === 'ยกเลิก') equipmentStatusStr = 'ยกเลิก';
        else equipmentStatusStr = 'ร้องขออุปกรณ์';
      }

      // Food Status
      if (booking.FoodOrder) {
        const fs = booking.FoodOrder.food_status?.toLowerCase() || '';
        if (fs === 'pending') foodStatusStr = 'รออนุมัติ';
        else if (fs === 'approved') foodStatusStr = 'อนุมัติ';
        else if (fs === 'rejected') foodStatusStr = 'ไม่อนุมัติ';
        else if (fs === 'cancelled') foodStatusStr = 'ยกเลิก';
        else if (fs === 'revised') foodStatusStr = 'มีการแก้ไข';
        else foodStatusStr = booking.FoodOrder.food_status;
      }
    }
  }`;

  emailContent = emailContent.replace(
    /  const displayStatus = status === 'food_updated' \? 'FOOD UPDATED' : status\.toUpperCase\(\);/,
    dbFetchBlock
  );

  // Replace Status HTML
  emailContent = emailContent.replace(
    /          <p><strong>Status:<\/strong> <span style="color: \$\{statusColors\[status\] \|\| '#6B7280'\}; font-weight: bold;">\$\{displayStatus\}<\/span><\/p>/,
    `          <p><strong>สถานะห้องประชุม:</strong> <span style="color: \${statusColors[status] || '#6B7280'}; font-weight: bold;">\${roomStatusStr}</span></p>
          <p><strong>สถานะการร้องขออุปกรณ์:</strong> \${equipmentStatusStr}</p>
          <p><strong>สถานะการจองอาหาร:</strong> \${foodStatusStr}</p>`
  );

  fs.writeFileSync('backend/src/services/email.service.ts', emailContent);

  // 2. Update booking.service.ts
  let bookingContent = fs.readFileSync('backend/src/services/booking.service.ts', 'utf-8');

  // Replace sendBookingNotification calls to include booking.id
  bookingContent = bookingContent.replace(
    /await sendBookingNotification\(owner\.email, data\.booking_name, room\.room_name, 'created', data\.booking_date, data\.start_time, data\.end_time, owner\.id, createChanges\);/g,
    `await sendBookingNotification(owner.email, data.booking_name, room.room_name, 'created', data.booking_date, data.start_time, data.end_time, owner.id, createChanges, booking.id);`
  );

  bookingContent = bookingContent.replace(
    /await sendBookingNotification\(email, data\.booking_name, room\.room_name, 'created', data\.booking_date, data\.start_time, data\.end_time, userId\);/g,
    `await sendBookingNotification(email, data.booking_name, room.room_name, 'created', data.booking_date, data.start_time, data.end_time, userId, undefined, booking.id);`
  );

  bookingContent = bookingContent.replace(
    /await sendBookingNotification\(owner\.email, booking\.booking_name, room\.room_name, 'updated', booking\.booking_date, booking\.start_time, booking\.end_time, userId, bookingChanges\);/g,
    `await sendBookingNotification(owner.email, booking.booking_name, room.room_name, 'updated', booking.booking_date, booking.start_time, booking.end_time, userId, bookingChanges, booking.id);`
  );

  bookingContent = bookingContent.replace(
    /await sendBookingNotification\(owner\.email, booking\.booking_name, room\.room_name, 'food_updated', booking\.booking_date, booking\.start_time, booking\.end_time, userId, foodChanges\);/g,
    `await sendBookingNotification(owner.email, booking.booking_name, room.room_name, 'food_updated', booking.booking_date, booking.start_time, booking.end_time, userId, foodChanges, booking.id);`
  );

  bookingContent = bookingContent.replace(
    /await sendBookingNotification\(email, booking\.booking_name, booking\.Room\?\.room_name \|\| '', 'cancelled', booking\.booking_date, booking\.start_time, booking\.end_time, userId\);/g,
    `await sendBookingNotification(email, booking.booking_name, booking.Room?.room_name || '', 'cancelled', booking.booking_date, booking.start_time, booking.end_time, userId, undefined, id);`
  );

  fs.writeFileSync('backend/src/services/booking.service.ts', bookingContent);

  console.log('Backend emails updated successfully.');
}

updateBackend();
