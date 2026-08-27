import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { logActivity } from '../services/activitylog.service';
import { getClientIP } from '../utils/helpers';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, password, remember_me } = req.body;
      const result = await AuthService.login(username, password, remember_me);
      await logActivity({ user_id: result.user.id, action: 'LOGIN', module: 'auth', description: `User ${username} logged in`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refresh_token } = req.body;
      const result = await AuthService.refreshToken(refresh_token);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async verifyOTP(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, otp_code, type } = req.body;
      const result = await AuthService.verifyOTP(email, otp_code, type);
      sendSuccess(res, result, 'OTP verified');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      sendSuccess(res, result);
    } catch (error: any) {
      next(error);
    }
  }

  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, otp_code, new_password } = req.body;
      const result = await AuthService.resetPassword(email, otp_code, new_password);
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.getProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.updateProfile(req.user!.id, req.body);
      sendSuccess(res, result, 'Profile updated');
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { current_password, new_password } = req.body;
      const result = await AuthService.changePassword(req.user!.id, current_password, new_password);
      sendSuccess(res, result);
    } catch (error: any) {
      if (error.statusCode) return sendError(res, error.message, error.statusCode);
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.logout(req.user!.id, req.body.refresh_token);
      await logActivity({ user_id: req.user!.id, action: 'LOGOUT', module: 'auth', description: `User ${req.user!.username} logged out`, ip_address: getClientIP(req), user_agent: req.headers['user-agent'] });
      sendSuccess(res, result);
    } catch (error: any) {
      next(error);
    }
  }
}
