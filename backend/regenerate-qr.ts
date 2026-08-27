import { Room } from './src/models';
import { generateQRCode } from './src/services/qrcode.service';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const rooms = await Room.findAll();
    for (const room of rooms) {
      const url = await generateQRCode(room.id);
      console.log(`Generated QR for room ${room.id}: ${url}`);
    }
    console.log('All QR codes regenerated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
run();
