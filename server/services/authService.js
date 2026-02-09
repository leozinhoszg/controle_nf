const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const { Op } = require('sequelize');
const jwtConfig = require('../config/jwt');

const extrairPerfilId = (perfil) => {
    if (!perfil) return null;
    if (typeof perfil === 'object' && perfil.id) return perfil.id;
    if (typeof perfil === 'number') return perfil;
    if (typeof perfil === 'string' && /^\d+$/.test(perfil)) return parseInt(perfil);
    return null;
};

const authService = {
    async gerarTokens(user, ipAddress, userAgent) {
        const perfilId = user.perfil_id || extrairPerfilId(user.perfil);

        const accessToken = jwt.sign(
            { id: user.id, usuario: user.usuario, email: user.email, perfil: perfilId },
            jwtConfig.accessTokenSecret,
            { expiresIn: jwtConfig.accessTokenExpiry, issuer: jwtConfig.issuer, audience: jwtConfig.audience }
        );

        const refreshToken = await this.gerarRefreshToken(user, ipAddress, userAgent);

        return { accessToken, refreshToken: refreshToken.token, expiresIn: jwtConfig.accessTokenExpiry };
    },

    async gerarRefreshToken(user, ipAddress, userAgent) {
        const token = crypto.randomBytes(64).toString('hex');
        const expires_at = new Date(Date.now() + jwtConfig.refreshTokenExpiryMs);

        const refreshToken = await RefreshToken.create({
            token,
            user_id: user.id,
            expires_at,
            created_by_ip: ipAddress,
            user_agent: userAgent
        });

        return refreshToken;
    },

    async atualizarTokens(token, ipAddress, userAgent) {
        const refreshToken = await RefreshToken.findOne({
            where: { token },
            include: [{ model: User.unscoped(), as: 'user' }]
        });

        if (!refreshToken) throw new Error('Token invalido');
        if (!refreshToken.is_active) {
            await this.revogarTokensFamilia(refreshToken, ipAddress);
            throw new Error('Token revogado ou expirado');
        }

        const user = refreshToken.user;
        if (!user || !user.ativo) throw new Error('Usuario inativo ou nao encontrado');

        refreshToken.revoked = new Date();
        refreshToken.revoked_by_ip = ipAddress;

        const novoRefreshToken = await this.gerarRefreshToken(user, ipAddress, userAgent);
        refreshToken.replaced_by_token = novoRefreshToken.token;
        await refreshToken.save();

        const perfilId = user.perfil_id;
        const accessToken = jwt.sign(
            { id: user.id, usuario: user.usuario, email: user.email, perfil: perfilId },
            jwtConfig.accessTokenSecret,
            { expiresIn: jwtConfig.accessTokenExpiry, issuer: jwtConfig.issuer, audience: jwtConfig.audience }
        );

        return { accessToken, refreshToken: novoRefreshToken.token, expiresIn: jwtConfig.accessTokenExpiry };
    },

    async revogarToken(token, ipAddress) {
        const refreshToken = await RefreshToken.findOne({ where: { token } });
        if (!refreshToken) throw new Error('Token nao encontrado');
        refreshToken.revoked = new Date();
        refreshToken.revoked_by_ip = ipAddress;
        await refreshToken.save();
    },

    async revogarTodosTokens(userId, ipAddress) {
        await RefreshToken.update(
            { revoked: new Date(), revoked_by_ip: ipAddress },
            { where: { user_id: userId, revoked: null } }
        );
    },

    async revogarTokensFamilia(refreshToken, ipAddress) {
        await this.revogarTodosTokens(refreshToken.user_id, ipAddress);
    },

    verificarAccessToken(token) {
        try {
            return jwt.verify(token, jwtConfig.accessTokenSecret, {
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });
        } catch (error) {
            throw new Error('Token invalido ou expirado');
        }
    },

    async listarSessoesAtivas(userId) {
        const tokens = await RefreshToken.findAll({
            where: {
                user_id: userId,
                revoked: null,
                expires_at: { [Op.gt]: new Date() }
            },
            attributes: ['created_by_ip', 'user_agent', 'created_at']
        });
        return tokens;
    }
};

module.exports = authService;
