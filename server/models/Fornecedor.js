const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fornecedor = sequelize.define('Fornecedor', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Nome do fornecedor e obrigatorio' }
        },
        set(val) {
            this.setDataValue('nome', val ? val.toUpperCase().trim() : val);
        }
    }
}, {
    tableName: 'fornecedores'
});

module.exports = Fornecedor;
