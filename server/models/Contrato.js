const mongoose = require('mongoose');

const contratoSchema = new mongoose.Schema({
    fornecedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Fornecedor',
        required: [true, 'Fornecedor é obrigatório']
    },
    'nr-contrato': {
        type: Number,
        required: [true, 'Número do contrato é obrigatório']
    },
    'cod-estabel': {
        type: String,
        default: '01'
    },
    observacao: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Virtual para obter sequências do contrato
contratoSchema.virtual('sequencias', {
    ref: 'Sequencia',
    localField: '_id',
    foreignField: 'contrato'
});

// Garantir que virtuals sejam incluídos no JSON
contratoSchema.set('toJSON', { virtuals: true });
contratoSchema.set('toObject', { virtuals: true });

// Índice composto para evitar duplicatas
contratoSchema.index({ fornecedor: 1, 'nr-contrato': 1, 'cod-estabel': 1 });

module.exports = mongoose.model('Contrato', contratoSchema);
