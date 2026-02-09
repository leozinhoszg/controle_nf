const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Perfil = sequelize.define('Perfil', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Nome do perfil e obrigatorio' },
            len: { args: [1, 50], msg: 'Nome deve ter no maximo 50 caracteres' }
        }
    },
    descricao: {
        type: DataTypes.STRING(200),
        defaultValue: null,
        validate: {
            len: { args: [0, 200], msg: 'Descricao deve ter no maximo 200 caracteres' }
        }
    },
    is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'perfis',
    indexes: [
        { fields: ['nome'] }
    ]
});

module.exports = Perfil;
