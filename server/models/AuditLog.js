const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: null
    },
    usuario_nome: {
        type: DataTypes.STRING(100),
        defaultValue: 'Sistema'
    },
    usuario_email: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    acao: {
        type: DataTypes.ENUM(
            'LOGIN_SUCESSO', 'LOGIN_FALHA', 'LOGIN_BLOQUEADO', 'LOGOUT', 'LOGOUT_TODOS',
            'REGISTRO', 'CONTA_ATIVADA', 'SENHA_ALTERADA', 'SENHA_RESET',
            'SENHA_RESET_SOLICITADO', 'EMAIL_VERIFICADO', 'OTP_SOLICITADO',
            'OTP_VERIFICADO', 'TOKEN_REFRESH', 'CRIAR', 'ATUALIZAR', 'EXCLUIR',
            'VISUALIZAR', 'ATIVAR', 'DESATIVAR', 'ALTERAR_PERMISSOES', 'ALTERAR_PERFIL',
            'SINCRONIZAR', 'SINCRONIZAR_LOTE', 'EXPORTAR', 'IMPORTAR',
            'EMAIL_ENVIADO', 'EMAIL_FALHA'
        ),
        allowNull: false
    },
    categoria: {
        type: DataTypes.ENUM(
            'AUTH', 'USUARIO', 'PERFIL', 'FORNECEDOR', 'CONTRATO', 'SEQUENCIA',
            'MEDICAO', 'SISTEMA', 'EMAIL', 'EMPRESA', 'ESTABELECIMENTO'
        ),
        allowNull: false
    },
    nivel: {
        type: DataTypes.ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'INFO'
    },
    recurso: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    recurso_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: null
    },
    recurso_nome: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    dados_anteriores: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    dados_novos: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    campos_alterados: {
        type: DataTypes.JSON,
        defaultValue: null
    },
    endereco_ip: {
        type: DataTypes.STRING(45),
        defaultValue: null
    },
    user_agent: {
        type: DataTypes.STRING(500),
        defaultValue: null
    },
    sucesso: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    mensagem_erro: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    metadados: {
        type: DataTypes.JSON,
        defaultValue: null
    }
}, {
    tableName: 'audit_logs',
    indexes: [
        { fields: [{ attribute: 'created_at', order: 'DESC' }] },
        { fields: ['usuario_id', { attribute: 'created_at', order: 'DESC' }] },
        { fields: ['categoria', { attribute: 'created_at', order: 'DESC' }] },
        { fields: ['acao', { attribute: 'created_at', order: 'DESC' }] },
        { fields: ['recurso', 'recurso_id'] },
        { fields: ['nivel', { attribute: 'created_at', order: 'DESC' }] },
        { fields: ['sucesso', { attribute: 'created_at', order: 'DESC' }] },
        { fields: ['categoria', 'acao', { attribute: 'created_at', order: 'DESC' }] }
    ]
});

module.exports = AuditLog;
