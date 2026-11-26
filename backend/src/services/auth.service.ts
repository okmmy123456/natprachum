import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { jwtConfig } from '../config/jwt';
import { User, Role, RefreshToken, OtpVerification } from '../models';
import { JwtPayload } from '../types';
import { generateOTP } from '../utils/helpers';
import { sendOTPEmail } from './email.service';

export class AuthService {
  static async register(data: any) {
    // Check existing
    const existing = await User.findOne({
      where: { [Op.or]: [{ username: data.username }, { email: data.email }] },
      paranoid: false,
    });
    if (existing) {
      throw { statusCode: 409, message: existing.username === data.username ? 'Username already exists' : 'Email already exists' };
    }

    const normalRole = await Role.findOne({ where: { role_code: 'NormalUser' } });
    if (!normalRole) throw { statusCode: 500, message: 'Default role not found' };

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate and send OTP
    const otpCode = generateOTP();
    await OtpVerification.create({
      email: data.email,
      otp_code: otpCode,
      type: 'register',
      expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      pending_data: JSON.stringify({
        ...data,
        password_hash: passwordHash,
        role_id: normalRole.id,
      }),
    });
    await sendOTPEmail(data.email, otpCode, 'register');

    return { username: data.username, email: data.email, message: 'Registration successful. Please verify your email.' };
  }

  static async login(username: string, password: string, rememberMe: boolean = false) {
    const user = await User.findOne({
      where: { [Op.or]: [{ username }, { email: username }] },
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user || !user.is_active || !user.password_hash) {
      throw { statusCode: 401, message: 'Invalid credentials or account is disabled' };
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.Role?.role_code || 'NormalUser',
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
    });

    const refreshExpiresIn = rememberMe ? '30d' : jwtConfig.refreshExpiresIn;
    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: refreshExpiresIn as any,
    });

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7));
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    // Update last login
    await user.update({ last_login_at: new Date() });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.Role?.role_code,
        role_name: user.Role?.role_name,
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
      },
    };
  }

  static async refreshToken(token: string) {
    const storedToken = await RefreshToken.findOne({
      where: { token, is_revoked: false },
    });

    if (!storedToken || new Date() > storedToken.expires_at) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }

    const decoded = jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'Role' }],
    });

    if (!user || !user.is_active) {
      throw { statusCode: 401, message: 'User not found or disabled' };
    }

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.Role?.role_code || 'NormalUser',
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn as any });

    return { access_token: accessToken };
  }

  static async verifyOTP(email: string, otpCode: string, type: string) {
    const otp = await OtpVerification.findOne({
      where: {
        email,
        otp_code: otpCode,
        type,
        is_used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      order: [['created_at', 'DESC']],
    });

    if (!otp) {
      throw { statusCode: 400, message: 'Invalid or expired OTP' };
    }

    await otp.update({ is_used: true });

    if (type === 'register') {
      if (!otp.pending_data) {
        throw { statusCode: 400, message: 'Registration data not found or expired' };
      }
      const userData = JSON.parse(otp.pending_data);

      // Check existing again (since some time passed since initial registration step)
      const existing = await User.findOne({
        where: { [Op.or]: [{ username: userData.username }, { email: userData.email }] },
        paranoid: false,
      });
      if (existing) {
        throw { statusCode: 409, message: existing.username === userData.username ? 'Username already exists' : 'Email already exists' };
      }

      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password_hash: userData.password_hash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role_id: userData.role_id,
        email_verified: true,
        is_active: true,
        mobile_phone: userData.mobile_phone,
        office_phone: userData.office_phone,
        company_id: userData.company_id,
        site_id: userData.site_id, site: userData.site,
        department_id: userData.department_id,
        department_code: userData.department_code,
        department_name: userData.department_name,
        position: userData.position,
      });

      await otp.update({ user_id: user.id });
    }

    return { message: 'OTP verified successfully' };
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset code has been sent' };
    }

    const otpCode = generateOTP();
    await OtpVerification.create({
      user_id: user.id,
      email,
      otp_code: otpCode,
      type: 'forgot_password',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });
    await sendOTPEmail(email, otpCode, 'forgot_password', user.id);

    return { message: 'If the email exists, a reset code has been sent' };
  }

  static async resetPassword(email: string, otpCode: string, newPassword: string) {
    // Verify OTP first
    await this.verifyOTP(email, otpCode, 'forgot_password');

    const user = await User.findOne({ where: { email } });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });

    // Revoke all refresh tokens
    await RefreshToken.update({ is_revoked: true }, { where: { user_id: user.id } });

    return { message: 'Password reset successfully' };
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    if (!user.password_hash) {
      throw { statusCode: 400, message: 'Account is authenticated via SSO and does not have a local password' };
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) throw { statusCode: 400, message: 'Current password is incorrect' };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash: passwordHash });

    return { message: 'Password changed successfully' };
  }

  static async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Role, as: 'Role', attributes: ['id', 'role_name', 'role_code'] },
        { model: (await import('../models')).Company, as: 'Company' },
        { model: (await import('../models')).Site, as: 'Site' },
        { model: (await import('../models')).Department, as: 'Department' },
      ],
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };
    return user;
  }

  static async updateProfile(userId: number, data: any) {
    const user = await User.findByPk(userId);
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const { password_hash, role_id, is_active, username, ...updateData } = data;
    await user.update(updateData);

    return await this.getProfile(userId);
  }

  static async logout(userId: number, refreshToken?: string) {
    if (refreshToken) {
      await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId, token: refreshToken } });
    } else {
      await RefreshToken.update({ is_revoked: true }, { where: { user_id: userId } });
    }
    return { message: 'Logged out successfully' };
  }

  static getTciConnectConfig() {
    const authorizeUrl = process.env.TCICONNECT_AUTHORIZE_URL || 'http://172.10.3.106:5009/api/oauth/authorize';
    const clientId = process.env.TCICONNECT_CLIENT_ID || 'app_natprachum_01';
    const redirectUri = process.env.TCICONNECT_REDIRECT_URI || 'http://172.10.3.106:5013/auth/callback';

    return {
      authorizeUrl,
      clientId,
      redirectUri,
    };
  }

  static async loginWithTciConnect(code: string, redirectUri?: string) {
    if (!code) {
      throw { statusCode: 400, message: 'Authorization code is required' };
    }

    const baseUrl = (process.env.TCICONNECT_URL || 'http://172.10.3.106:5009').replace(/\/+$/, '');
    const clientId = process.env.TCICONNECT_CLIENT_ID || 'app_natprachum_01';
    const clientSecret = process.env.TCICONNECT_CLIENT_SECRET || 'secret_natprachum_key_5013';
    const effectiveRedirectUri = redirectUri || process.env.TCICONNECT_REDIRECT_URI || 'http://172.10.3.106:5013/auth/callback';

    const tokenRes = await fetch(`${baseUrl}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: effectiveRedirectUri,
      }),
    });

    const tokenData: any = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      throw {
        statusCode: 400,
        message: tokenData?.error_description || tokenData?.error || tokenData?.message || 'ไม่สามารถยืนยันสิทธิ์กับ TciConnect ได้',
      };
    }

    const tciUser = tokenData?.user || tokenData?.data?.user || tokenData?.data;
    if (!tciUser || (!tciUser.id && !tciUser.email)) {
      throw { statusCode: 400, message: 'ไม่พบข้อมูลผู้ใช้ที่ส่งกลับมาจาก TciConnect' };
    }

    const tciconnectId = String(tciUser.id || '').trim();
    const email = String(tciUser.email || '').trim().toLowerCase();
    const rawName = String(tciUser.name || '').trim();
    const firstName = String(tciUser.firstName || tciUser.first_name || (rawName ? rawName.split(/\s+/)[0] : '') || 'User').slice(0, 100);
    const lastName = String(tciUser.lastName || tciUser.last_name || (rawName ? rawName.split(/\s+/).slice(1).join(' ') : '') || '').slice(0, 100);
    const avatarUrl = tciUser.avatarUrl || tciUser.avatar_url || null;
    const departmentName = tciUser.department_name || null;
    const departmentCode = tciUser.department_code || null;
    const mobilePhone = tciUser.mobile_phone || tciUser.phone || null;
    const officePhone = tciUser.desk_phone || null;

    let user: any = null;

    // 1. Find by tciconnect_id
    if (tciconnectId) {
      user = await User.findOne({
        where: { tciconnect_id: tciconnectId },
        include: [{ model: Role, as: 'Role' }],
      });
    }

    // 2. If not found, match by email
    if (!user && email) {
      user = await User.findOne({
        where: { email },
        include: [{ model: Role, as: 'Role' }],
      });

      if (user) {
        // Link tciconnect_id to existing account
        await user.update({
          tciconnect_id: tciconnectId || user.tciconnect_id,
          first_name: user.first_name || firstName,
          last_name: user.last_name || lastName,
          department_name: user.department_name || departmentName,
          department_code: user.department_code || departmentCode,
          avatar_url: avatarUrl || user.avatar_url,
          mobile_phone: user.mobile_phone || mobilePhone,
          office_phone: user.office_phone || officePhone,
          email_verified: true,
        });
      }
    }

    // 3. If user still does not exist, Auto-register new user
    if (!user) {
      const normalRole = await Role.findOne({ where: { role_code: 'NormalUser' } });
      const roleId = normalRole ? normalRole.id : 4;

      let baseUsername = email ? email.split('@')[0] : (firstName || 'user');
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase() || 'tciconnect_user';

      let candidateUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ where: { username: candidateUsername }, paranoid: false })) {
        candidateUsername = `${baseUsername}_${counter++}`;
      }

      user = await User.create({
        username: candidateUsername,
        password_hash: null,
        first_name: firstName,
        last_name: lastName,
        email: email || `${candidateUsername}@tciconnect.local`,
        email_verified: true,
        tciconnect_id: tciconnectId || null,
        role_id: roleId,
        department_name: departmentName,
        department_code: departmentCode,
        mobile_phone: mobilePhone,
        office_phone: officePhone,
        avatar_url: avatarUrl,
        is_active: true,
      });

      await user.reload({ include: [{ model: Role, as: 'Role' }] });
    }

    if (!user.is_active) {
      throw { statusCode: 403, message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน' };
    }

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.Role?.role_code || 'NormalUser',
    };

    const accessToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn as any,
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: '30d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await RefreshToken.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });

    await user.update({ last_login_at: new Date() });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.Role?.role_code || 'NormalUser',
        role_name: user.Role?.role_name || 'Normal User',
        avatar_url: user.avatar_url,
        email_verified: user.email_verified,
        department_name: user.department_name,
      },
    };
  }
}
