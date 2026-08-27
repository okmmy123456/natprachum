import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

const qrDir = path.join(__dirname, '..', '..', 'uploads', 'qrcodes');

// Ensure QR directory exists
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir, { recursive: true });
}

export const generateQRCode = async (roomId: number): Promise<string> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5012';
  const bookingUrl = `${frontendUrl}/booking?room_id=${roomId}`;
  const filename = `room_${roomId}_qr.png`;
  const filepath = path.join(qrDir, filename);

  await QRCode.toFile(filepath, bookingUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return `/uploads/qrcodes/${filename}`;
};

export const getQRCodeDataURL = async (roomId: number): Promise<string> => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5012';
  const bookingUrl = `${frontendUrl}/booking?room_id=${roomId}`;

  return QRCode.toDataURL(bookingUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });
};
