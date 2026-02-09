const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    usuario: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Nome de usuario e obrigatorio' },
            len: { args: [3, 30], msg: 'Usuario deve ter no minimo 3 caracteres' }
        },
        set(val) {
            this.setDataValue('usuario', val ? val.toLowerCase().trim() : val);
        }
    },
    nome: {
        type: DataTypes.STRING(100),
        defaultValue: null
    },
    foto_perfil: {
        type: DataTypes.TEXT('medium'),
        defaultValue: null
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: 'Email invalido' },
            notEmpty: { msg: 'Email e obrigatorio' }
        },
        set(val) {
            this.setDataValue('email', val ? val.toLowerCase().trim() : val);
        }
    },
    senha: {
        type: DataTypes.STRING(255),
        defaultValue: null,
        validate: {
            len: { args: [6, 255], msg: 'Senha deve ter no minimo 6 caracteres' }
        }
    },
    conta_ativada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    token_ativacao_conta: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    token_ativacao_expira: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    perfil_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        defaultValue: null
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    email_verificado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    token_verificacao_email: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    token_verificacao_expira: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    token_reset_senha: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    token_reset_expira: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    otp_code: {
        type: DataTypes.STRING(255),
        defaultValue: null
    },
    otp_expira: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    ultimo_login: {
        type: DataTypes.DATE,
        defaultValue: null
    },
    tentativas_login: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    bloqueado_ate: {
        type: DataTypes.DATE,
        defaultValue: null
    }
}, {
    tableName: 'users',
    defaultScope: {
        attributes: {
            exclude: ['senha', 'token_verificacao_email', 'token_verificacao_expira',
                       'token_reset_senha', 'token_reset_expira', 'otp_code', 'otp_expira',
                       'token_ativacao_conta', 'token_ativacao_expira']
        }
    },
    scopes: {
        withSenha: {
            attributes: { exclude: [] }
        },
        withTokens: {
            attributes: { exclude: [] }
        },
        withOtp: {
            attributes: { exclude: [] }
        },
        full: {
            attributes: { exclude: [] }
        }
    },
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('senha') && user.senha) {
                const salt = await bcrypt.genSalt(12);
                user.senha = await bcrypt.hash(user.senha, salt);
            }
        }
    }
});

// Instance methods
User.prototype.compararSenha = async function(senhaInformada) {
    return await bcrypt.compare(senhaInformada, this.senha);
};

User.prototype.gerarTokenVerificacao = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.token_verificacao_email = crypto.createHash('sha256').update(token).digest('hex');
    this.token_verificacao_expira = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return token;
};

User.prototype.gerarTokenResetSenha = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.token_reset_senha = crypto.createHash('sha256').update(token).digest('hex');
    this.token_reset_expira = new Date(Date.now() + 60 * 60 * 1000);
    return token;
};

User.prototype.gerarTokenAtivacaoConta = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.token_ativacao_conta = crypto.createHash('sha256').update(token).digest('hex');
    this.token_ativacao_expira = new Date(Date.now() + 72 * 60 * 60 * 1000);
    return token;
};

User.prototype.gerarCodigoOtp = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp_code = crypto.createHash('sha256').update(otp).digest('hex');
    this.otp_expira = new Date(Date.now() + 15 * 60 * 1000);
    return otp;
};

User.prototype.verificarOtp = function(otpInformado) {
    if (!this.otp_code || !this.otp_expira) return false;
    if (Date.now() > new Date(this.otp_expira).getTime()) return false;
    const hashOtpInformado = crypto.createHash('sha256').update(otpInformado).digest('hex');
    return this.otp_code === hashOtpInformado;
};

module.exports = User;
