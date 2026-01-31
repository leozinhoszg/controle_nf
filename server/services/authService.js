const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const jwtConfig = require('../config/jwt');

/**
 * Extrai o ID do perfil de forma segura
 * Lida com perfis populados (objeto) ou não populados (ObjectId)
 */
const extrairPerfilId = (perfil) => {
    if (!perfil) return null;
    // Se for objeto populado, retorna o _id
    if (typeof perfil === 'object' && perfil._id) {
        return perfil._id;
    }
    // Se for ObjectId ou string de ObjectId valido
    if (typeof perfil === 'object' || (typeof perfil === 'string' && perfil.match(/^[0-9a-fA-F]{24}$/))) {
        return perfil;
    }
    // Se for string antiga (como 'admin', 'usuario'), retorna null
    return null;
};

const authService = {
    /**
     * Gera par de tokens (access + refresh)
     * @param {Object} user - Usuario
     * @param {string} ipAddress - IP do cliente
     * @param {string} userAgent - User-Agent do cliente
     */
    async gerarTokens(user, ipAddress, userAgent) {
        const perfilId = extrairPerfilId(user.perfil);

        // Gerar Access Token (curta duracao)
        const accessToken = jwt.sign(
            {
                id: user._id,
                usuario: user.usuario,
                email: user.email,
                perfil: perfilId
            },
            jwtConfig.accessTokenSecret,
            {
                expiresIn: jwtConfig.accessTokenExpiry,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        );

        // Gerar Refresh Token (longa duracao)
        const refreshToken = await this.gerarRefreshToken(user, ipAddress, userAgent);

        return {
            accessToken,
            refreshToken: refreshToken.token,
            expiresIn: jwtConfig.accessTokenExpiry
        };
    },

    /**
     * Gera e salva refresh token no banco
     * @param {Object} user - Usuario
     * @param {string} ipAddress - IP do cliente
     * @param {string} userAgent - User-Agent
     */
    async gerarRefreshToken(user, ipAddress, userAgent) {
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + jwtConfig.refreshTokenExpiryMs);

        const refreshToken = new RefreshToken({
            token,
            user: user._id,
            expiresAt,
            createdByIp: ipAddress,
            userAgent
        });

        await refreshToken.save();
        return refreshToken;
    },

    /**
     * Atualiza tokens usando refresh token
     * @param {string} token - Refresh token atual
     * @param {string} ipAddress - IP do cliente
     * @param {string} userAgent - User-Agent
     */
    async atualizarTokens(token, ipAddress, userAgent) {
        const refreshToken = await RefreshToken.findOne({ token }).populate('user');

        if (!refreshToken) {
            throw new Error('Token invalido');
        }

        if (!refreshToken.isActive) {
            // Se token foi revogado, revoga toda a familia de tokens
            await this.revogarTokensFamilia(refreshToken, ipAddress);
            throw new Error('Token revogado ou expirado');
        }

        const user = refreshToken.user;
        if (!user || !user.ativo) {
            throw new Error('Usuario inativo ou nao encontrado');
        }

        // Revogar token atual
        refreshToken.revoked = Date.now();
        refreshToken.revokedByIp = ipAddress;

        // Gerar novo refresh token
        const novoRefreshToken = await this.gerarRefreshToken(user, ipAddress, userAgent);

        // Atualizar referencia
        refreshToken.replacedByToken = novoRefreshToken.token;
        await refreshToken.save();

        // Gerar novo access token
        const perfilId = extrairPerfilId(user.perfil);
        const accessToken = jwt.sign(
            {
                id: user._id,
                usuario: user.usuario,
                email: user.email,
                perfil: perfilId
            },
            jwtConfig.accessTokenSecret,
            {
                expiresIn: jwtConfig.accessTokenExpiry,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            }
        );

        return {
            accessToken,
            refreshToken: novoRefreshToken.token,
            expiresIn: jwtConfig.accessTokenExpiry
        };
    },

    /**
     * Revoga um refresh token
     * @param {string} token - Token a ser revogado
     * @param {string} ipAddress - IP do cliente
     */
    async revogarToken(token, ipAddress) {
        const refreshToken = await RefreshToken.findOne({ token });

        if (!refreshToken) {
            throw new Error('Token nao encontrado');
        }

        refreshToken.revoked = Date.now();
        refreshToken.revokedByIp = ipAddress;
        await refreshToken.save();
    },

    /**
     * Revoga todos os tokens de um usuario (logout de todos dispositivos)
     * @param {string} userId - ID do usuario
     * @param {string} ipAddress - IP do cliente
     */
    async revogarTodosTokens(userId, ipAddress) {
        await RefreshToken.updateMany(
            { user: userId, revoked: null },
            { revoked: Date.now(), revokedByIp: ipAddress }
        );
    },

    /**
     * Revoga familia de tokens (em caso de reuso de token revogado)
     * @param {Object} refreshToken - Token comprometido
     * @param {string} ipAddress - IP
     */
    async revogarTokensFamilia(refreshToken, ipAddress) {
        // Revoga todos os tokens do usuario por seguranca
        await this.revogarTodosTokens(refreshToken.user, ipAddress);
    },

    /**
     * Verifica access token
     * @param {string} token - Access token
     */
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

    /**
     * Lista sessoes ativas de um usuario
     * @param {string} userId - ID do usuario
     */
    async listarSessoesAtivas(userId) {
        const tokens = await RefreshToken.find({
            user: userId,
            revoked: null,
            expiresAt: { $gt: new Date() }
        }).select('createdByIp userAgent createdAt');

        return tokens;
    }
};

module.exports = authService;
