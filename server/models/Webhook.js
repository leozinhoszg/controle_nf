const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Webhook = sequelize.define('Webhook', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome do webhook e obrigatorio' }
        }
    },
    url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'URL do webhook e obrigatoria' }
        }
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    ultimo_disparo: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    falhas_consecutivas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'webhooks'
});

module.exports = Webhook;
