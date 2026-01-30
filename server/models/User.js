const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    usuario: {
        type: String,
        required: [true, 'Nome de usuario e obrigatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Usuario deve ter no minimo 3 caracteres'],
        maxlength: [30, 'Usuario deve ter no maximo 30 caracteres']
    },
    email: {
        type: String,
        required: [true, 'Email e obrigatorio'],
        unique: true,
        trim: true,
        lowercase: true
    },
    senha: {
        type: String,
        required: [true, 'Senha e obrigatoria'],
        minlength: [6, 'Senha deve ter no minimo 6 caracteres'],
        select: false // Nao retorna senha por padrao nas queries
    },
    perfil: {
        type: String,
        enum: ['admin', 'gerente', 'usuario'],
        default: 'usuario'
    },
    ativo: {
        type: Boolean,
        default: true
    },
    emailVerificado: {
        type: Boolean,
        default: false
    },
    tokenVerificacaoEmail: {
        type: String,
        select: false
    },
    tokenVerificacaoExpira: {
        type: Date,
        select: false
    },
    tokenResetSenha: {
        type: String,
        select: false
    },
    tokenResetExpira: {
        type: Date,
        select: false
    },
    ultimoLogin: {
        type: Date
    },
    tentativasLogin: {
        type: Number,
        default: 0
    },
    bloqueadoAte: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-save hook para hash da senha
userSchema.pre('save', async function(next) {
    if (!this.isModified('senha')) return next();

    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
});

// Metodo para comparar senhas
userSchema.methods.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

// Metodo para gerar token de verificacao
userSchema.methods.gerarTokenVerificacao = function() {
    const token = crypto.randomBytes(32).toString('hex');

    this.tokenVerificacaoEmail = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.tokenVerificacaoExpira = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

    return token;
};

// Metodo para gerar token de reset de senha
userSchema.methods.gerarTokenResetSenha = function() {
    const token = crypto.randomBytes(32).toString('hex');

    this.tokenResetSenha = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    this.tokenResetExpira = Date.now() + 60 * 60 * 1000; // 1 hora

    return token;
};

// Indices para buscas
userSchema.index({ email: 1 });
userSchema.index({ usuario: 1 });

module.exports = mongoose.model('User', userSchema);
