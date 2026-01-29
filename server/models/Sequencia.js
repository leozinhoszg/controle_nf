const mongoose = require('mongoose');

const sequenciaSchema = new mongoose.Schema({
    contrato: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contrato',
        required: [true, 'Contrato é obrigatório']
    },
    'num-seq-item': {
        type: Number,
        required: [true, 'Número da sequência é obrigatório']
    },
    diaEmissao: {
        type: Number,
        required: [true, 'Dia de emissão é obrigatório'],
        min: 1,
        max: 31
    },
    valor: {
        type: Number,
        required: [true, 'Valor é obrigatório'],
        min: 0
    },
    statusMensal: {
        type: Map,
        of: {
            type: String,
            enum: ['ok', 'pendente', 'atrasada', 'atualizar_contrato', 'futuro']
        },
        default: {}
    }
}, {
    timestamps: true
});

// Índice composto
sequenciaSchema.index({ contrato: 1, 'num-seq-item': 1 });

module.exports = mongoose.model('Sequencia', sequenciaSchema);
