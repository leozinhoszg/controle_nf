const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do webhook e obrigatorio'],
        trim: true
    },
    url: {
        type: String,
        required: [true, 'URL do webhook e obrigatoria'],
        trim: true
    },
    eventos: [{
        type: String,
        enum: ['nf_atrasada', 'nf_pendente', 'nf_status_alterado', 'contrato_vencendo', 'resumo_diario'],
        default: ['nf_atrasada']
    }],
    ativo: {
        type: Boolean,
        default: true
    },
    ultimoDisparo: {
        type: Date
    },
    falhasConsecutivas: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Webhook', webhookSchema);
