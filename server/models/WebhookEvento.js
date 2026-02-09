const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WebhookEvento = sequelize.define('WebhookEvento', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    webhook_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    evento: {
        type: DataTypes.ENUM(
            'nf_atrasada', 'nf_pendente', 'nf_status_alterado',
            'contrato_vencendo', 'resumo_diario'
        ),
        allowNull: false
    }
}, {
    tableName: 'webhook_eventos',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['webhook_id', 'evento'] }
    ]
});

module.exports = WebhookEvento;
