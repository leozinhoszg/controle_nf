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
    nome: {
        type: String,
        trim: true,
        maxlength: [100, 'Nome deve ter no maximo 100 caracteres']
    },
    fotoPerfil: {
        type: String,
        default: null
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Perfil',
        default: null
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
    otpCode: {
        type: String,
        select: false
    },
    otpExpira: {
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

// Metodo para gerar codigo OTP de 6 digitos
userSchema.methods.gerarCodigoOtp = function() {
    // Gera codigo numerico de 6 digitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Armazena hash do OTP por seguranca
    this.otpCode = crypto
        .createHash('sha256')
        .update(otp)
        .digest('hex');

    this.otpExpira = Date.now() + 15 * 60 * 1000; // 15 minutos

    return otp;
};

// Metodo para verificar codigo OTP
userSchema.methods.verificarOtp = function(otpInformado) {
    if (!this.otpCode || !this.otpExpira) {
        return false;
    }

    if (Date.now() > this.otpExpira) {
        return false;
    }

    const hashOtpInformado = crypto
        .createHash('sha256')
        .update(otpInformado)
        .digest('hex');

    return this.otpCode === hashOtpInformado;
};

// Nota: indices para email e usuario ja sao criados automaticamente
// devido a propriedade unique: true no schema

module.exports = mongoose.model('User', userSchema);
