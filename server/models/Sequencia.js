const mongoose = require('mongoose');

const sequenciaSchema = new mongoose.Schema({
    contrato: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contrato',
        required: [true, 'Contrato é obrigatório']
    },
    numero: {
        type: Number,
        required: [true, 'Número da sequência é obrigatório']
    },
    diaEmissao: {
        type: Number,
        required: [true, 'Dia de emissão é obrigatório'],
        min: 1,
        max: 31
    },
    custo: {
        type: Number,
        required: [true, 'Custo é obrigatório'],
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
sequenciaSchema.index({ contrato: 1, numero: 1 });

module.exports = mongoose.model('Sequencia', sequenciaSchema);
