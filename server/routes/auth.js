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

// Rotas OTP para redefinicao de senha
router.post('/solicitar-otp-reset', forgotPasswordLimiter, authController.solicitarOtpResetSenha);
router.post('/verificar-otp-reset', authController.verificarOtpResetSenha);

// Rotas protegidas
router.post('/logout', autenticar, authController.logout);
router.post('/logout-all', autenticar, authController.logoutAll);
router.get('/me', autenticar, authController.getMe);
router.put('/me', autenticar, authController.updateProfile);
router.put('/me/foto', autenticar, authController.updateProfilePhoto);
router.put('/me/senha', autenticar, authController.changePassword);
router.get('/sessions', autenticar, authController.getSessions);

module.exports = router;
