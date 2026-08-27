require('dotenv').config();
const { Sequelize } = require('sequelize');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function run() {
  const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://172.10.3.106:5013';
  const qrDir = path.join(__dirname, 'uploads', 'qrcodes');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const [rooms] = await sequelize.query('SELECT id FROM meeting_rooms');
  
  for (const room of rooms) {
    const bookingUrl = `${frontendUrl}/booking?room_id=${room.id}`;
    const filename = `room_${room.id}_qr.png`;
    const filepath = path.join(qrDir, filename);

    await QRCode.toFile(filepath, bookingUrl, {
      width: 400, margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' }
    });
    
    const qrUrl = `/uploads/qrcodes/${filename}`;
    await sequelize.query('UPDATE meeting_rooms SET qr_code_url = ? WHERE id = ?', {
      replacements: [qrUrl, room.id]
    });
    console.log(`Updated QR code for room ${room.id} -> ${bookingUrl}`);
  }
  
  await sequelize.close();
  console.log('Done.');
}
run();
