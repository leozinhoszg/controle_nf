const { sequelize } = require('../config/db');
const Perfil = require('./Perfil');
const PerfilPermissao = require('./PerfilPermissao');
const User = require('./User');
const Fornecedor = require('./Fornecedor');
const Empresa = require('./Empresa');
const Estabelecimento = require('./Estabelecimento');
const Contrato = require('./Contrato');
const Sequencia = require('./Sequencia');
const Medicao = require('./Medicao');
const RefreshToken = require('./RefreshToken');
const AuditLog = require('./AuditLog');
const Webhook = require('./Webhook');
const WebhookEvento = require('./WebhookEvento');

// === Associations ===

// Perfil <-> PerfilPermissao
Perfil.hasMany(PerfilPermissao, { foreignKey: 'perfil_id', as: 'permissoesRef' });
PerfilPermissao.belongsTo(Perfil, { foreignKey: 'perfil_id' });

// Perfil <-> User
Perfil.hasMany(User, { foreignKey: 'perfil_id' });
User.belongsTo(Perfil, { foreignKey: 'perfil_id', as: 'perfil' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'usuario_id' });
AuditLog.belongsTo(User, { foreignKey: 'usuario_id', as: 'usuario' });

// Empresa <-> Estabelecimento
Empresa.hasMany(Estabelecimento, { foreignKey: 'empresa_id', as: 'estabelecimentos' });
Estabelecimento.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

// Fornecedor <-> Contrato
Fornecedor.hasMany(Contrato, { foreignKey: 'fornecedor_id', as: 'contratos' });
Contrato.belongsTo(Fornecedor, { foreignKey: 'fornecedor_id', as: 'fornecedor' });

// Estabelecimento <-> Contrato
Estabelecimento.hasMany(Contrato, { foreignKey: 'estabelecimento_id' });
Contrato.belongsTo(Estabelecimento, { foreignKey: 'estabelecimento_id', as: 'estabelecimento' });

// Contrato <-> Sequencia
Contrato.hasMany(Sequencia, { foreignKey: 'contrato_id', as: 'sequencias' });
Sequencia.belongsTo(Contrato, { foreignKey: 'contrato_id', as: 'contrato' });

// Sequencia <-> Medicao
Sequencia.hasMany(Medicao, { foreignKey: 'sequencia_id', as: 'medicoes' });
Medicao.belongsTo(Sequencia, { foreignKey: 'sequencia_id', as: 'sequencia' });

// Webhook <-> WebhookEvento
Webhook.hasMany(WebhookEvento, { foreignKey: 'webhook_id', as: 'eventosRef' });
WebhookEvento.belongsTo(Webhook, { foreignKey: 'webhook_id' });

module.exports = {
    sequelize,
    Perfil,
    PerfilPermissao,
    User,
    Fornecedor,
    Empresa,
    Estabelecimento,
    Contrato,
    Sequencia,
    Medicao,
    RefreshToken,
    AuditLog,
    Webhook,
    WebhookEvento
};
