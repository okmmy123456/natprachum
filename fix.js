const fs = require('fs');
let content = fs.readFileSync('backend/src/services/booking.service.ts', 'utf-8');

const regex = /    \/\/ Validate time\r?\n    if \(data\.start_time >= data\.end_time\) \{\r?\n      throw \{ statusCode: 400, message: 'End time must be after start time' \};\r?\n    \}\r?\n\r?\n        await BookingParticipant\.create\(\{ \.\.\.p, booking_id: booking\.id \}\);/;

const replace = `    // Validate time
    if (data.start_time >= data.end_time) {
      throw { statusCode: 400, message: 'End time must be after start time' };
    }

    // Check for time conflicts
    await this.checkTimeConflict(data.room_id, data.booking_date, data.start_time, data.end_time);

    // Check holiday
    await this.checkHoliday(data.booking_date);

    // Get statuses
    const pendingStatus = await BookingStatus.findOne({ where: { status_code: 'pending' } });
    const approvedStatus = await BookingStatus.findOne({ where: { status_code: 'approved' } });
    if (!pendingStatus || !approvedStatus) throw { statusCode: 500, message: 'Booking statuses not configured' };

    const initialStatusId = room.auto_approve ? approvedStatus.id : pendingStatus.id;

    const booking = await Booking.create({
      ...data,
      booking_no: generateBookingNo(),
      user_id: userId,
      status_id: initialStatusId,
      is_guest_booking: !userId,
    });

    // Create participants if provided
    if (data.participants && Array.isArray(data.participants)) {
      for (const p of data.participants) {
        await BookingParticipant.create({ ...p, booking_id: booking.id });`;

if (regex.test(content)) {
  content = content.replace(regex, replace);
  fs.writeFileSync('backend/src/services/booking.service.ts', content);
  console.log('Fixed successfully');
} else {
  console.log('Regex did not match');
}
