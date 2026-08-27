const axios = require('axios');

async function main() {
  try {
    // Assuming we can fetch the booking via the API without auth if we just hit /api/bookings somehow?
    // Wait, it requires auth. Let me just test the backend service method directly instead of API.
    const { BookingService } = require('./src/services/booking.service');
    // We need to initialize sequelize models first
    require('./src/models');
    
    // Actually, I can just query the BookingService
    const res = await BookingService.getAll({ search: 'BK-20260810-6ED0' });
    console.log(JSON.stringify(res.rows[0].User, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
