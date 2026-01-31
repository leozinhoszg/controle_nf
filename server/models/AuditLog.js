const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Informacoes do usuario que executou a acao
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    usuarioNome: {
        type: String,
        default: 'Sistema'
    },
    usuarioEmail: {
        type: String,
        default: null
    },

    // Tipo de acao
    acao: {
        type: String,
        required: true,
        enum: [
            // Autenticacao
            'LOGIN_SUCESSO',
            'LOGIN_FALHA',
            'LOGIN_BLOQUEADO',
            'LOGOUT',
            'LOGOUT_TODOS',
            'REGISTRO',
            'SENHA_ALTERADA',
            'SENHA_RESET',
            'SENHA_RESET_SOLICITADO',
            'EMAIL_VERIFICADO',
            'OTP_SOLICITADO',
            'OTP_VERIFICADO',
            'TOKEN_REFRESH',

            // CRUD Genericos
            'CRIAR',
            'ATUALIZAR',
            'EXCLUIR',
            'VISUALIZAR',

            // Acoes especificas
            'ATIVAR',
            'DESATIVAR',
            'ALTERAR_PERMISSOES',
            'ALTERAR_PERFIL',
            'SINCRONIZAR',
            'SINCRONIZAR_LOTE',
            'EXPORTAR',
            'IMPORTAR',

            // Acoes de email
            'EMAIL_ENVIADO',
            'EMAIL_FALHA'
        ]
    },

    // Categoria/Nivel da acao
    categoria: {
        type: String,
        required: true,
        enum: ['AUTH', 'USUARIO', 'PERFIL', 'FORNECEDOR', 'CONTRATO', 'SEQUENCIA', 'MEDICAO', 'SISTEMA', 'EMAIL']
    },

    // Nivel de criticidade
    nivel: {
        type: String,
        required: true,
        enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
        default: 'INFO'
    },

    // Recurso afetado
    recurso: {
        type: String,
        required: true
    },
    recursoId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    recursoNome: {
        type: String,
        default: null
    },

    // Detalhes da acao
    descricao: {
        type: String,
        required: true
    },

    // Dados antes da modificacao (para UPDATE/DELETE)
    dadosAnteriores: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // Dados apos a modificacao (para CREATE/UPDATE)
    dadosNovos: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    // Campos que foram modificados
    camposAlterados: [{
        type: String
    }],

    // Informacoes de contexto
    enderecoIp: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },

    // Resultado da operacao
    sucesso: {
        type: Boolean,
        required: true,
        default: true
    },
    mensagemErro: {
        type: String,
        default: null
    },

    // Metadados adicionais
    metadados: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indices para buscas rapidas
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ usuarioId: 1, createdAt: -1 });
auditLogSchema.index({ categoria: 1, createdAt: -1 });
auditLogSchema.index({ acao: 1, createdAt: -1 });
auditLogSchema.index({ recurso: 1, recursoId: 1 });
auditLogSchema.index({ nivel: 1, createdAt: -1 });
auditLogSchema.index({ sucesso: 1, createdAt: -1 });

// Indice composto para buscas frequentes
auditLogSchema.index({ categoria: 1, acao: 1, createdAt: -1 });

// TTL Index - remover logs antigos apos 365 dias (configuravel)
// Comente esta linha se quiser manter logs indefinidamente
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
