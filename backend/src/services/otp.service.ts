import { sendEmail } from './email.service';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

// In-memory OTP store for demo purposes
// Key: email, Value: { code, expiresAt }
const otpStore = new Map<string, { code: string, expiresAt: number }>();

export class OtpService {
  static async requestOtp(email: string): Promise<boolean> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes from now

    otpStore.set(email, { code, expiresAt });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4F46E5;">Booking History Login</h2>
        <p>Your OTP code to view your booking history is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">${code}</div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `;

    return await sendEmail({
      to: email,
      subject: 'Your OTP Code for Booking History',
      html,
      type: 'otp',
    });
  }

  static verifyOtp(email: string, code: string): string | null {
    const record = otpStore.get(email);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return null; // Expired
    }

    if (record.code === code) {
      otpStore.delete(email); // Clean up after successful verification
      
      // Generate a special history token valid for 2 hours
      const token = jwt.sign(
        { email, role_name: 'HistoryViewer' },
        jwtConfig.secret,
        { expiresIn: '2h' }
      );
      
      return token;
    }

    return null;
  }
}
