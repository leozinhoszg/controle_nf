const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Estabelecimento = sequelize.define('Estabelecimento', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    empresa_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    cod_estabel: {
        type: DataTypes.STRING(10),
        allowNull: false
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
    tableName: 'estabelecimentos',
    indexes: [
        { unique: true, fields: ['empresa_id', 'cod_estabel'] }
    ]
});

module.exports = Estabelecimento;
