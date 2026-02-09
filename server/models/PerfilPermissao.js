const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PerfilPermissao = sequelize.define('PerfilPermissao', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    perfil_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
    },
    permissao: {
        type: DataTypes.ENUM(
            'dashboard', 'fornecedores', 'contratos', 'relatorio',
            'usuarios', 'perfis', 'auditoria', 'empresas', 'estabelecimentos'
        ),
        allowNull: false
    }
}, {
    tableName: 'perfil_permissoes',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['perfil_id', 'permissao'] }
    ]
});

module.exports = PerfilPermissao;
