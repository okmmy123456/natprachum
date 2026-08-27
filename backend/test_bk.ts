import sequelize from './src/config/database';
import Booking from './src/models/Booking';

async function test() {
  const b = await Booking.findOne({ where: { booking_no: 'BK-20260804-C70A' } });
  console.log(b?.toJSON());
  process.exit(0);
}
test();
