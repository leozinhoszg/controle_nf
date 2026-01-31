const authService = require('../services/authService');
const { Perfil } = require('../models');

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
            perfilId: decoded.perfil
        };

        // Buscar permissoes do perfil
        if (decoded.perfil) {
            const perfil = await Perfil.findById(decoded.perfil);
            if (perfil) {
                req.user.perfil = perfil;
                req.user.permissoes = perfil.permissoes || [];
                req.user.isAdmin = perfil.isAdmin || false;
            }
        }

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
 * Middleware de autorizacao por perfil/role (legado)
 * @param  {...string} perfisPermitidos - Lista de perfis permitidos
 */
const autorizar = (...perfisPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Nao autenticado' });
        }

        // Se usuario e admin, permite acesso
        if (req.user.isAdmin) {
            return next();
        }

        // Verifica se o nome do perfil esta na lista
        const nomePerfil = req.user.perfil?.nome?.toLowerCase();
        if (nomePerfil && perfisPermitidos.map(p => p.toLowerCase()).includes(nomePerfil)) {
            return next();
        }

        return res.status(403).json({
            message: 'Acesso negado. Permissao insuficiente.'
        });
    };
};

/**
 * Middleware de autorizacao por permissao especifica
 * @param {string} permissaoNecessaria - Permissao necessaria (ex: 'usuarios', 'fornecedores')
 */
const autorizarPermissao = (permissaoNecessaria) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Nao autenticado' });
        }

        // Se usuario e admin, permite acesso total
        if (req.user.isAdmin) {
            return next();
        }

        // Verifica se usuario tem a permissao necessaria
        if (req.user.permissoes && req.user.permissoes.includes(permissaoNecessaria)) {
            return next();
        }

        return res.status(403).json({
            message: 'Acesso negado. Voce nao tem permissao para acessar este recurso.'
        });
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
    autorizarPermissao,
    autenticarOpcional
};
