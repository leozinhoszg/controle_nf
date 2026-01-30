module.exports = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'seu-segredo-access-token-muito-seguro',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'seu-segredo-refresh-token-muito-seguro',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms

    // Configuracoes de seguranca
    issuer: 'controle-contratos-api',
    audience: 'controle-contratos-frontend'
};
