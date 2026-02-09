const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Empresa = sequelize.define('Empresa', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    cod_empresa: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false,
        set(val) {
            this.setDataValue('nome', val ? val.toUpperCase().trim() : val);
        }
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'empresas'
});

module.exports = Empresa;
