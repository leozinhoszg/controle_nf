const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdByIp: {
        type: String
    },
    revoked: {
        type: Date
    },
    revokedByIp: {
        type: String
    },
    replacedByToken: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Metodo virtual para verificar se token expirou
refreshTokenSchema.virtual('isExpired').get(function() {
    return Date.now() >= this.expiresAt;
});

// Metodo virtual para verificar se token foi revogado
refreshTokenSchema.virtual('isRevoked').get(function() {
    return this.revoked != null;
});

// Metodo virtual para verificar se token esta ativo
refreshTokenSchema.virtual('isActive').get(function() {
    return !this.isRevoked && !this.isExpired;
});

// Indices para performance e limpeza
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ token: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
