const nodemailer = require('nodemailer');
const {
    templateOtpResetSenha,
    templateOtpVerificacaoEmail,
    templateNovoUsuario,
    templateVerificacaoEmail,
    templateAlertaLogin,
    templateSenhaAlterada,
    templateResetSenhaLink,
    APP_NAME
} = require('./emailTemplates');

// Verificar se SMTP esta habilitado
const isSmtpEnabled = () => {
    return process.env.SMTP_ENABLE === 'true';
};

// Configuracao do transporter
let transporter = null;

const getTransporter = () => {
    if (!transporter && isSmtpEnabled()) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: parseInt(process.env.SMTP_PORT) === 465, // true para 465, false para outras portas
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASS
            },
            tls: {
                // Necessario para Office365
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
    }
    return transporter;
};

// Verificar conexao SMTP
const verificarConexaoSmtp = async () => {
    if (!isSmtpEnabled()) {
        console.log('SMTP desabilitado. Emails nao serao enviados.');
        return false;
    }

    try {
        const transport = getTransporter();
        await transport.verify();
        console.log('Conexao SMTP verificada com sucesso');
        return true;
    } catch (error) {
        console.error('Erro na conexao SMTP:', error.message);
        return false;
    }
};

// Funcao base para enviar email
const enviarEmail = async (to, subject, html) => {
    if (!isSmtpEnabled()) {
        console.log(`[EMAIL DESABILITADO] Para: ${to}, Assunto: ${subject}`);
        return { success: false, reason: 'SMTP desabilitado' };
    }

    const mailOptions = {
        from: `"${APP_NAME}" <${process.env.SMTP_USER_EMAIL || process.env.SMTP_USERNAME}>`,
        to,
        subject: `${subject} - ${APP_NAME}`,
        html
    };

    try {
        const transport = getTransporter();
        const info = await transport.sendMail(mailOptions);
        console.log(`Email enviado para ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Erro ao enviar email para ${to}:`, error.message);
        throw error;
    }
};

const emailService = {
    /**
     * Verifica se o servico de email esta ativo
     */
    isEnabled: isSmtpEnabled,

    /**
     * Verifica a conexao SMTP
     */
    verificarConexao: verificarConexaoSmtp,

    /**
     * Envia codigo OTP para redefinicao de senha
     * @param {Object} user - Usuario com email e nome
     * @param {string} codigoOtp - Codigo OTP de 6 digitos
     */
    async enviarOtpResetSenha(user, codigoOtp) {
        const html = templateOtpResetSenha(user.usuario, codigoOtp);

        try {
            await enviarEmail(user.email, 'Codigo de Redefinicao de Senha', html);
            console.log(`OTP de reset enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar OTP de reset:', error);
            throw error;
        }
    },

    /**
     * Envia codigo OTP para verificacao de email
     * @param {Object} user - Usuario com email e nome
     * @param {string} codigoOtp - Codigo OTP de 6 digitos
     */
    async enviarOtpVerificacaoEmail(user, codigoOtp) {
        const html = templateOtpVerificacaoEmail(user.usuario, codigoOtp);

        try {
            await enviarEmail(user.email, 'Codigo de Verificacao de Email', html);
            console.log(`OTP de verificacao enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar OTP de verificacao:', error);
            throw error;
        }
    },

    /**
     * Envia email de boas-vindas para novo usuario criado pelo admin
     * @param {Object} user - Usuario com email e nome
     * @param {string} senhaTemporaria - Senha temporaria gerada
     */
    async enviarEmailNovoUsuario(user, senhaTemporaria) {
        const html = templateNovoUsuario(user.usuario, user.email, senhaTemporaria);

        try {
            await enviarEmail(user.email, 'Bem-vindo ao Sistema', html);
            console.log(`Email de boas-vindas enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de boas-vindas:', error);
            throw error;
        }
    },

    /**
     * Envia email de verificacao de conta
     * @param {Object} user - Usuario com email e nome
     * @param {string} token - Token de verificacao
     */
    async enviarEmailVerificacao(user, token) {
        const urlVerificacao = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email/${token}`;
        const html = templateVerificacaoEmail(user.usuario, urlVerificacao);

        try {
            await enviarEmail(user.email, 'Verifique seu Email', html);
            console.log(`Email de verificacao enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de verificacao:', error);
            throw error;
        }
    },

    /**
     * Envia email de reset de senha com link
     * @param {Object} user - Usuario com email e nome
     * @param {string} token - Token de reset
     */
    async enviarEmailResetSenha(user, token) {
        const urlReset = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-senha/${token}`;
        const html = templateResetSenhaLink(user.usuario, urlReset);

        try {
            await enviarEmail(user.email, 'Redefinicao de Senha', html);
            console.log(`Email de reset enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de reset:', error);
            throw error;
        }
    },

    /**
     * Envia notificacao de login em novo dispositivo
     * @param {Object} user - Usuario
     * @param {Object} info - Informacoes do dispositivo
     */
    async enviarAlertaLogin(user, info) {
        const html = templateAlertaLogin(user.usuario, {
            ip: info.ip || 'Desconhecido',
            userAgent: info.userAgent || 'Desconhecido',
            dataHora: new Date().toLocaleString('pt-BR')
        });

        try {
            await enviarEmail(user.email, 'Novo Login Detectado', html);
            console.log(`Alerta de login enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar alerta de login:', error);
            // Nao lanca erro para nao interromper o fluxo de login
        }
    },

    /**
     * Envia confirmacao de alteracao de senha
     * @param {Object} user - Usuario
     */
    async enviarConfirmacaoSenhaAlterada(user) {
        const html = templateSenhaAlterada(user.usuario);

        try {
            await enviarEmail(user.email, 'Senha Alterada com Sucesso', html);
            console.log(`Confirmacao de alteracao de senha enviada para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar confirmacao de senha:', error);
            // Nao lanca erro para nao interromper o fluxo
        }
    }
};

module.exports = emailService;
