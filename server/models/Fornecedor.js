const mongoose = require('mongoose');

const fornecedorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do fornecedor é obrigatório'],
        trim: true,
        uppercase: true
    }
}, {
    timestamps: true
});

// Virtual para obter contratos do fornecedor
fornecedorSchema.virtual('contratos', {
    ref: 'Contrato',
    localField: '_id',
    foreignField: 'fornecedor'
});

// Garantir que virtuals sejam incluídos no JSON
fornecedorSchema.set('toJSON', { virtuals: true });
fornecedorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fornecedor', fornecedorSchema);
