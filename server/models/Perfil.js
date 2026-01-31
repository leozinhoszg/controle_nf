const mongoose = require('mongoose');

const perfilSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome do perfil e obrigatorio'],
        unique: true,
        trim: true,
        maxlength: [50, 'Nome deve ter no maximo 50 caracteres']
    },
    descricao: {
        type: String,
        trim: true,
        maxlength: [200, 'Descricao deve ter no maximo 200 caracteres']
    },
    permissoes: [{
        type: String,
        enum: [
            'dashboard',
            'fornecedores',
            'contratos',
            'relatorio',
            'usuarios',
            'perfis'
        ]
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    ativo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indice para buscas por nome
perfilSchema.index({ nome: 1 });

module.exports = mongoose.model('Perfil', perfilSchema);
