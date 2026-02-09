const authService = require('../services/authService');
const { Perfil, PerfilPermissao } = require('../models');

const autenticar = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token de acesso nao fornecido' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = authService.verificarAccessToken(token);

        req.user = {
            id: decoded.id,
            usuario: decoded.usuario,
            email: decoded.email,
            perfilId: decoded.perfil
        };

        if (decoded.perfil) {
            const perfil = await Perfil.findByPk(decoded.perfil, {
                include: [{ model: PerfilPermissao, as: 'permissoesRef' }]
            });
            if (perfil) {
                req.user.perfil = perfil;
                req.user.permissoes = perfil.permissoesRef ? perfil.permissoesRef.map(p => p.permissao) : [];
                req.user.isAdmin = perfil.is_admin || false;
            }
        }

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ message: 'Token invalido' });
    }
};

const autorizar = (...perfisPermitidos) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Nao autenticado' });
        if (req.user.isAdmin) return next();

        const nomePerfil = req.user.perfil?.nome?.toLowerCase();
        if (nomePerfil && perfisPermitidos.map(p => p.toLowerCase()).includes(nomePerfil)) {
            return next();
        }

        return res.status(403).json({ message: 'Acesso negado. Permissao insuficiente.' });
    };
};

const autorizarPermissao = (permissaoNecessaria) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Nao autenticado' });
        if (req.user.isAdmin) return next();

        if (req.user.permissoes && req.user.permissoes.includes(permissaoNecessaria)) {
            return next();
        }

        return res.status(403).json({ message: 'Acesso negado. Voce nao tem permissao para acessar este recurso.' });
    };
};

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
        next();
    }
};

module.exports = { autenticar, autorizar, autorizarPermissao, autenticarOpcional };
