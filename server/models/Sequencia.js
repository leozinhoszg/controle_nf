const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Sequencia = sequelize.define('Sequencia', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    contrato_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    num_seq_item: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dia_emissao: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 31
        }
    },
    valor: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            min: 0
        },
        get() {
            const val = this.getDataValue('valor');
            return val !== null ? parseFloat(val) : null;
        }
    },
    status_mensal: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    tableName: 'sequencias',
    indexes: [
        { fields: ['contrato_id', 'num_seq_item'] }
    ]
});

module.exports = Sequencia;
