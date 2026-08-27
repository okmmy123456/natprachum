import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendError } from '../utils/response';
import { RolePermission, Permission } from '../models';

/**
 * Check if user has one of the allowed roles
 */
export const requireRole = (...roleCodes: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roleCodes.includes(req.user.role_name)) {
      sendError(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

/**
 * Check if user has a specific permission
 */
export const requirePermission = (...permissionCodes: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      // SuperAdmin bypasses permission check
      if (req.user.role_name === 'SuperAdmin') {
        next();
        return;
      }

      const rolePerms = await RolePermission.findAll({
        where: { role_id: req.user.role_id },
        include: [{ model: Permission, as: 'Permission' }],
      });

      const userPermCodes = rolePerms.map((rp: any) => rp.Permission?.permission_code).filter(Boolean);
      const hasPermission = permissionCodes.some(code => userPermCodes.includes(code));

      if (!hasPermission) {
        sendError(res, 'Insufficient permissions', 403);
        return;
      }

      next();
    } catch (error) {
      sendError(res, 'Permission check failed', 500);
    }
  };
};
