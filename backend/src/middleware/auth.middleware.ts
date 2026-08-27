import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AuthRequest, JwtPayload } from '../types';
import { sendError } from '../utils/response';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Access token is required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role_id: decoded.role_id,
      role_name: decoded.role_name,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Token expired', 401);
      return;
    }
    sendError(res, 'Invalid token', 401);
  }
};

export const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role_id: decoded.role_id,
        role_name: decoded.role_name,
      };
    }
  } catch {
    // Token invalid/expired - continue without auth
  }
  next();
};
