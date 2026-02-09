const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Contrato = sequelize.define('Contrato', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    fornecedor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    nr_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    estabelecimento_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    cod_estabel: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '01'
    },
    observacao: {
        type: DataTypes.TEXT,
        defaultValue: ''
    }
}, {
    tableName: 'contratos',
    indexes: [
        { fields: ['fornecedor_id', 'nr_contrato', 'estabelecimento_id'] }
    ]
});

module.exports = Contrato;
