import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { registerValidator, loginValidator, forgotPasswordValidator, verifyOtpValidator, resetPasswordValidator, changePasswordValidator, updateProfileValidator } from '../validators/auth.validator';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, AuthController.register);
router.post('/login', authLimiter, loginValidator, validate, AuthController.login);
router.get('/tciconnect/config', AuthController.getTciConnectConfig);
router.post('/tciconnect/callback', AuthController.tciConnectCallback);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/verify-otp', verifyOtpValidator, validate, AuthController.verifyOTP);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, AuthController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, AuthController.resetPassword);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, updateProfileValidator, validate, AuthController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);
router.post('/logout', authenticate, AuthController.logout);

export default router;
