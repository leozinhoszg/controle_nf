const authService = require('../services/authService');

/**
 * Middleware de autenticacao JWT
 * Verifica se o token de acesso e valido
 */
const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token de acesso nao fornecido' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = authService.verificarAccessToken(token);

        // Adicionar dados do usuario ao request
        req.user = {
            id: decoded.id,
            usuario: decoded.usuario,
            email: decoded.email,
            perfil: decoded.perfil
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ message: 'Token invalido' });
    }
};

/**
 * Middleware de autorizacao por perfil/role
 * @param  {...string} perfisPermitidos - Lista de perfis permitidos
 */
const autorizar = (...perfisPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Nao autenticado' });
        }

        if (!perfisPermitidos.includes(req.user.perfil)) {
            return res.status(403).json({
                message: 'Acesso negado. Permissao insuficiente.'
            });
        }

        next();
    };
};

/**
 * Middleware opcional de autenticacao
 * Nao bloqueia se nao houver token, mas decodifica se houver
 */
const autenticarOpcional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = authService.verificarAccessToken(token);
            req.user = {
                id: decoded.id,
                usuario: decoded.usuario,
                email: decoded.email,
                perfil: decoded.perfil
            };
        }

        next();
    } catch (error) {
        // Se token invalido, continua sem usuario
        next();
    }
};

module.exports = {
    autenticar,
    autorizar,
    autenticarOpcional
};
