/**
 * Templates de Email - PROMA SIGMA
 * Templates profissionais com branding da aplicacao
 */

const APP_NAME = 'PROMA SIGMA';
const APP_LOGO_URL = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/logo.png`
    : 'https://via.placeholder.com/200x60?text=PROMA+SIGMA';
const PRIMARY_COLOR = '#1a365d';
const SECONDARY_COLOR = '#2563eb';

/**
 * Layout base para todos os emails
 */
const baseLayout = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f6f9;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%); padding: 30px 40px; border-radius: 8px 8px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                                ${APP_NAME}
                            </h1>
                            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
                                Sistema de Gestao de Contratos
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${content}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
                                            Este email foi enviado automaticamente pelo sistema ${APP_NAME}.
                                        </p>
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                                            &copy; ${new Date().getFullYear()} PROMA Group. Todos os direitos reservados.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * Template para codigo OTP de redefinicao de senha
 */
const templateOtpResetSenha = (nomeUsuario, codigoOtp) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${PRIMARY_COLOR}; font-size: 22px; font-weight: 600;">
            Redefinicao de Senha
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Recebemos uma solicitacao para redefinir a senha da sua conta no ${APP_NAME}.
            Utilize o codigo abaixo para concluir o processo:
        </p>

        <!-- Codigo OTP -->
        <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Seu codigo de verificacao
            </p>
            <div style="font-size: 36px; font-weight: 700; color: ${PRIMARY_COLOR}; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${codigoOtp}
            </div>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Importante:</strong> Este codigo expira em <strong>15 minutos</strong>.
                Nao compartilhe este codigo com ninguem.
            </p>
        </div>

        <p style="margin: 25px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Se voce nao solicitou a redefinicao de senha, ignore este email.
            Sua senha permanecera inalterada.
        </p>
    `;

    return baseLayout(content);
};

/**
 * Template para novo usuario criado pelo admin
 */
const templateNovoUsuario = (nomeUsuario, email, senhaTemporaria) => {
    const urlLogin = process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL}/login`
        : 'http://localhost:3000/login';

    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${PRIMARY_COLOR}; font-size: 22px; font-weight: 600;">
            Bem-vindo ao ${APP_NAME}!
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Uma conta foi criada para voce no sistema ${APP_NAME} - Sistema de Gestao de Contratos.
            Abaixo estao suas credenciais de acesso:
        </p>

        <!-- Credenciais -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Usuario:</span>
                        <strong style="color: ${PRIMARY_COLOR}; font-size: 15px; margin-left: 10px;">${nomeUsuario}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Email:</span>
                        <strong style="color: ${PRIMARY_COLOR}; font-size: 15px; margin-left: 10px;">${email}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Senha temporaria:</span>
                        <code style="background-color: #e2e8f0; color: ${PRIMARY_COLOR}; font-size: 15px; padding: 4px 12px; border-radius: 4px; margin-left: 10px; font-family: 'Courier New', monospace;">
                            ${senhaTemporaria}
                        </code>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Botao de acesso -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${urlLogin}"
               style="display: inline-block; background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${SECONDARY_COLOR} 100%);
                      color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px;
                      font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Acessar o Sistema
            </a>
        </div>

        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Seguranca:</strong> Recomendamos que voce altere sua senha apos o primeiro login.
            </p>
        </div>

        <p style="margin: 25px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Em caso de duvidas, entre em contato com o administrador do sistema.
        </p>
    `;

    return baseLayout(content);
};

/**
 * Template para verificacao de email
 */
const templateVerificacaoEmail = (nomeUsuario, urlVerificacao) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${PRIMARY_COLOR}; font-size: 22px; font-weight: 600;">
            Verifique seu Email
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Obrigado por se registrar no ${APP_NAME}! Para ativar sua conta,
            clique no botao abaixo para verificar seu endereco de email:
        </p>

        <!-- Botao de verificacao -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${urlVerificacao}"
               style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                      color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px;
                      font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                Verificar Email
            </a>
        </div>

        <p style="margin: 20px 0; color: #64748b; font-size: 13px; text-align: center;">
            Ou copie e cole o link abaixo no seu navegador:
        </p>
        <p style="margin: 0 0 25px 0; color: #3b82f6; font-size: 13px; word-break: break-all; text-align: center;">
            ${urlVerificacao}
        </p>

        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
                <strong>Atencao:</strong> Este link expira em <strong>24 horas</strong>.
            </p>
        </div>

        <p style="margin: 25px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Se voce nao solicitou este registro, ignore este email.
        </p>
    `;

    return baseLayout(content);
};

/**
 * Template para alerta de login
 */
const templateAlertaLogin = (nomeUsuario, info) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #dc2626; font-size: 22px; font-weight: 600;">
            Novo Login Detectado
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Detectamos um novo acesso a sua conta no ${APP_NAME}.
            Confira os detalhes abaixo:
        </p>

        <!-- Detalhes do login -->
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Endereco IP:</span>
                        <strong style="color: #991b1b; font-size: 15px; margin-left: 10px;">${info.ip}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Navegador:</span>
                        <strong style="color: #991b1b; font-size: 15px; margin-left: 10px;">${info.userAgent}</strong>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;">
                        <span style="color: #64748b; font-size: 13px;">Data/Hora:</span>
                        <strong style="color: #991b1b; font-size: 15px; margin-left: 10px;">${info.dataHora}</strong>
                    </td>
                </tr>
            </table>
        </div>

        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Nao foi voce?</strong> Altere sua senha imediatamente e entre em contato com o administrador.
            </p>
        </div>
    `;

    return baseLayout(content);
};

/**
 * Template para redefinicao de senha com link
 */
const templateResetSenhaLink = (nomeUsuario, urlReset) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: ${PRIMARY_COLOR}; font-size: 22px; font-weight: 600;">
            Redefinicao de Senha
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Recebemos uma solicitacao para redefinir a senha da sua conta no ${APP_NAME}.
            Clique no botao abaixo para criar uma nova senha:
        </p>

        <!-- Botao de reset -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${urlReset}"
               style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                      color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px;
                      font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
                Redefinir Minha Senha
            </a>
        </div>

        <p style="margin: 20px 0; color: #64748b; font-size: 13px; text-align: center;">
            Ou copie e cole o link abaixo no seu navegador:
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 0 0 25px 0;">
            <p style="margin: 0; color: #3b82f6; font-size: 12px; word-break: break-all; text-align: center;">
                ${urlReset}
            </p>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Importante:</strong> Este link expira em <strong>1 hora</strong>.
                Apos esse periodo, voce precisara solicitar um novo link.
            </p>
        </div>

        <p style="margin: 25px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Se voce nao solicitou a redefinicao de senha, ignore este email.
            Sua senha permanecera inalterada.
        </p>
    `;

    return baseLayout(content);
};

/**
 * Template para codigo OTP de verificacao de email
 */
const templateOtpVerificacaoEmail = (nomeUsuario, codigoOtp) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #059669; font-size: 22px; font-weight: 600;">
            Verificacao de Email
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Para verificar seu email no ${APP_NAME}, utilize o codigo abaixo:
        </p>

        <!-- Codigo OTP -->
        <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Seu codigo de verificacao
            </p>
            <div style="font-size: 36px; font-weight: 700; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${codigoOtp}
            </div>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Importante:</strong> Este codigo expira em <strong>15 minutos</strong>.
                Nao compartilhe este codigo com ninguem.
            </p>
        </div>

        <p style="margin: 25px 0 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
            Apos a verificacao, seu email estara confirmado e voce tera acesso completo ao sistema.
        </p>
    `;

    return baseLayout(content);
};

/**
 * Template para confirmacao de alteracao de senha
 */
const templateSenhaAlterada = (nomeUsuario) => {
    const content = `
        <h2 style="margin: 0 0 20px 0; color: #059669; font-size: 22px; font-weight: 600;">
            Senha Alterada com Sucesso
        </h2>

        <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Ola <strong>${nomeUsuario}</strong>,
        </p>

        <p style="margin: 0 0 25px 0; color: #475569; font-size: 15px; line-height: 1.6;">
            Sua senha no ${APP_NAME} foi alterada com sucesso em
            <strong>${new Date().toLocaleString('pt-BR')}</strong>.
        </p>

        <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
                Se voce realizou esta alteracao, nenhuma acao adicional e necessaria.
            </p>
        </div>

        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Nao foi voce?</strong> Entre em contato imediatamente com o administrador do sistema.
            </p>
        </div>
    `;

    return baseLayout(content);
};

module.exports = {
    templateOtpResetSenha,
    templateOtpVerificacaoEmail,
    templateNovoUsuario,
    templateVerificacaoEmail,
    templateAlertaLogin,
    templateSenhaAlterada,
    templateResetSenhaLink,
    APP_NAME
};
