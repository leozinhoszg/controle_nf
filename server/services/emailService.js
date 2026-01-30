const nodemailer = require('nodemailer');

// Configuracao do transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const emailService = {
    /**
     * Envia email de verificacao de conta
     * @param {Object} user - Usuario com email e nome
     * @param {string} token - Token de verificacao
     */
    async enviarEmailVerificacao(user, token) {
        const urlVerificacao = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email/${token}`;

        const mailOptions = {
            from: `"Sistema de Contratos" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Verifique seu email - Sistema de Contratos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Bem-vindo ao Sistema de Contratos!</h2>
                    <p>Ola <strong>${user.usuario}</strong>,</p>
                    <p>Obrigado por se registrar. Por favor, clique no botao abaixo para verificar seu email:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${urlVerificacao}"
                           style="background-color: #007bff; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Verificar Email
                        </a>
                    </div>
                    <p>Ou copie e cole o link abaixo no seu navegador:</p>
                    <p style="color: #666; word-break: break-all;">${urlVerificacao}</p>
                    <p><strong>Este link expira em 24 horas.</strong></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Se voce nao solicitou este registro, ignore este email.
                    </p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email de verificacao enviado para: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Erro ao enviar email de verificacao:', error);
            throw error;
        }
    },

    /**
     * Envia email de reset de senha
     * @param {Object} user - Usuario com email e nome
     * @param {string} token - Token de reset
     */
    async enviarEmailResetSenha(user, token) {
        const urlReset = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-senha/${token}`;

        const mailOptions = {
            from: `"Sistema de Contratos" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Redefinicao de Senha - Sistema de Contratos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Redefinicao de Senha</h2>
                    <p>Ola <strong>${user.usuario}</strong>,</p>
                    <p>Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${urlReset}"
                           style="background-color: #dc3545; color: white; padding: 12px 30px;
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Redefinir Senha
                        </a>
                    </div>
                    <p>Ou copie e cole o link abaixo no seu navegador:</p>
                    <p style="color: #666; word-break: break-all;">${urlReset}</p>
                    <p><strong>Este link expira em 1 hora.</strong></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Se voce nao solicitou a redefinicao de senha, ignore este email.
                        Sua senha permanecera inalterada.
                    </p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
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
        const mailOptions = {
            from: `"Sistema de Contratos" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Novo login detectado - Sistema de Contratos',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Novo Login Detectado</h2>
                    <p>Ola <strong>${user.usuario}</strong>,</p>
                    <p>Detectamos um novo login na sua conta:</p>
                    <ul>
                        <li><strong>IP:</strong> ${info.ip}</li>
                        <li><strong>Navegador:</strong> ${info.userAgent}</li>
                        <li><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</li>
                    </ul>
                    <p>Se nao foi voce, altere sua senha imediatamente.</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Erro ao enviar alerta de login:', error);
        }
    }
};

module.exports = emailService;
