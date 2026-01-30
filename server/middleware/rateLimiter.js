const rateLimit = require('express-rate-limit');

// Rate limiter para rotas de login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: {
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
    }
});

// Rate limiter para registro
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 registros por IP
    message: {
        message: 'Muitas contas criadas deste IP. Tente novamente em 1 hora.'
    }
});

// Rate limiter para forgot password
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 solicitacoes
    message: {
        message: 'Muitas solicitacoes. Tente novamente em 1 hora.'
    }
});

// Rate limiter geral para API
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisicoes por minuto
    message: {
        message: 'Muitas requisicoes. Tente novamente em breve.'
    }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    apiLimiter
};
