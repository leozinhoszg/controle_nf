const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    created_by_ip: {
        type: DataTypes.STRING(45),
        defaultValue: null
    },
    revoked: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    revoked_by_ip: {
        type: DataTypes.STRING(45),
        defaultValue: null
    },
    replaced_by_token: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    user_agent: {
        type: DataTypes.STRING(500),
        defaultValue: null
    },
    is_expired: {
        type: DataTypes.VIRTUAL,
        get() {
            return Date.now() >= new Date(this.expires_at).getTime();
        }
    },
    is_revoked: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.revoked != null;
        }
    },
    is_active: {
        type: DataTypes.VIRTUAL,
        get() {
            return !this.is_revoked && !this.is_expired;
        }
    }
}, {
    tableName: 'refresh_tokens',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['expires_at'] }
    ]
});

module.exports = RefreshToken;
