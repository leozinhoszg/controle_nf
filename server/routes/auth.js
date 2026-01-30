const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { autenticar } = require('../middleware/auth');
const {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter
} = require('../middleware/rateLimiter');

// Rotas publicas
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Rotas protegidas
router.post('/logout', autenticar, authController.logout);
router.post('/logout-all', autenticar, authController.logoutAll);
router.get('/me', autenticar, authController.getMe);
router.get('/sessions', autenticar, authController.getSessions);

module.exports = router;
