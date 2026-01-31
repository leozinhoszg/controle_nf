/**
 * Templates de Email - PROMA SIGMA
 * Templates profissionais com branding da aplicacao
 * Compativel com: Outlook (novo/antigo), Hotmail, Gmail, Yahoo, Apple Mail
 */

const APP_NAME = 'PROMA SIGMA';
const APP_LOGO_URL = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/logo.png`
    : 'https://via.placeholder.com/200x60?text=PROMA+SIGMA';
const PRIMARY_COLOR = '#1a365d';
const SECONDARY_COLOR = '#2563eb';

/**
 * Gera botao bulletproof compativel com todos os clientes de email
 * @param {string} url - URL do link
 * @param {string} text - Texto do botao
 * @param {string} bgColor - Cor de fundo do botao
 * @param {string} textColor - Cor do texto (default: branco)
 */
const bulletproofButton = (url, text, bgColor, textColor = '#ffffff') => `
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:50px;v-text-anchor:middle;width:220px;" arcsize="10%" strokecolor="${bgColor}" fillcolor="${bgColor}">
<w:anchorlock/>
<center style="color:${textColor};font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;font-size:16px;font-weight:bold;">
${text}
</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
<tr>
<td style="border-radius:8px;background-color:${bgColor};">
<a href="${url}" target="_blank" style="display:block;padding:14px 40px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;font-size:16px;font-weight:600;color:${textColor};text-decoration:none;text-align:center;border-radius:8px;">
${text}
</a>
</td>
</tr>
</table>
<!--<![endif]-->
`;

/**
 * Layout base para todos os emails - Compativel com Outlook
 */
const baseLayout = (content) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<!--[if gte mso 9]>
<xml>
<o:OfficeDocumentSettings>
<o:AllowPNG/>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
<![endif]-->
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${APP_NAME}</title>
<!--[if mso]>
<style type="text/css">
body, table, td {font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important;}
</style>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style type="text/css">
body {
margin: 0 !important;
padding: 0 !important;
-webkit-text-size-adjust: 100% !important;
-ms-text-size-adjust: 100% !important;
}
table {
border-collapse: collapse !important;
mso-table-lspace: 0pt !important;
mso-table-rspace: 0pt !important;
}
img {
-ms-interpolation-mode: bicubic;
border: 0;
height: auto;
line-height: 100%;
outline: none;
text-decoration: none;
}
a[x-apple-data-detectors] {
color: inherit !important;
text-decoration: none !important;
font-size: inherit !important;
font-family: inherit !important;
font-weight: inherit !important;
line-height: inherit !important;
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
<!--[if mso]>
<style type="text/css">
body, table, td, p, a, span {font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif !important;}
</style>
<![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f6f9;">
<tr>
<td align="center" style="padding:40px 20px;">
<!--[if mso]>
<table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="600">
<tr>
<td>
<![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
<!-- Header com VML para Outlook -->
<tr>
<td align="center" style="background-color:${PRIMARY_COLOR};">
<!--[if gte mso 9]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:100px;">
<v:fill type="solid" color="${PRIMARY_COLOR}"/>
<v:textbox inset="0,0,0,0">
<![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td align="center" valign="middle" style="padding:30px 40px;background-color:${PRIMARY_COLOR};">
<h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
${APP_NAME}
</h1>
<p style="margin:8px 0 0 0;color:#b8c5d6;font-size:14px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Sistema de Gestao de Contratos
</p>
</td>
</tr>
</table>
<!--[if gte mso 9]>
</v:textbox>
</v:rect>
<![endif]-->
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:40px;background-color:#ffffff;">
${content}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f8fafc;padding:25px 40px;border-top:1px solid #e2e8f0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td align="center">
<p style="margin:0 0 10px 0;color:#64748b;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Este email foi enviado automaticamente pelo sistema ${APP_NAME}.
</p>
<p style="margin:0;color:#94a3b8;font-size:12px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
&copy; ${new Date().getFullYear()} PROMA Group. Todos os direitos reservados.
</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
<!--[if mso]>
</td>
</tr>
</table>
<![endif]-->
</td>
</tr>
</table>
</body>
</html>
`;

/**
 * Caixa de informacoes com borda (compativel com Outlook)
 */
const infoBox = (bgColor, borderColor, textColor, content) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:25px 0;">
<tr>
<td style="background-color:${bgColor};border-left:4px solid ${borderColor};padding:15px 20px;">
<p style="margin:0;color:${textColor};font-size:14px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
${content}
</p>
</td>
</tr>
</table>
`;

/**
 * Caixa de credenciais (compativel com Outlook)
 */
const credentialsBox = (items) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;margin:25px 0;">
<tr>
<td style="padding:25px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
${items.map(item => `
<tr>
<td style="padding:8px 0;">
<span style="color:#64748b;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">${item.label}:</span>
<strong style="color:${PRIMARY_COLOR};font-size:15px;margin-left:10px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">${item.value}</strong>
</td>
</tr>
`).join('')}
</table>
</td>
</tr>
</table>
`;

/**
 * Caixa de codigo OTP (compativel com Outlook)
 */
const otpBox = (codigo, bgColor, textColor) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
<tr>
<td align="center" style="background-color:${bgColor};padding:30px;">
<p style="margin:0 0 10px 0;color:${textColor};font-size:14px;text-transform:uppercase;letter-spacing:1px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Seu codigo de verificacao
</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="font-size:36px;font-weight:700;color:${PRIMARY_COLOR};letter-spacing:8px;font-family:Courier New,monospace;">
${codigo}
</td>
</tr>
</table>
</td>
</tr>
</table>
`;

/**
 * Template para codigo OTP de redefinicao de senha
 */
const templateOtpResetSenha = (nomeUsuario, codigoOtp) => {
    const content = `
<h2 style="margin:0 0 20px 0;color:${PRIMARY_COLOR};font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Redefinicao de Senha
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Recebemos uma solicitacao para redefinir a senha da sua conta no ${APP_NAME}.
Utilize o codigo abaixo para concluir o processo:
</p>

${otpBox(codigoOtp, '#f1f5f9', '#64748b')}

${infoBox('#fef3c7', '#f59e0b', '#92400e', '<strong>Importante:</strong> Este codigo expira em <strong>15 minutos</strong>. Nao compartilhe este codigo com ninguem.')}

<p style="margin:25px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
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
<h2 style="margin:0 0 20px 0;color:${PRIMARY_COLOR};font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Bem-vindo ao ${APP_NAME}!
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Uma conta foi criada para voce no sistema ${APP_NAME} - Sistema de Gestao de Contratos.
Abaixo estao suas credenciais de acesso:
</p>

${credentialsBox([
    { label: 'Usuario', value: nomeUsuario },
    { label: 'Email', value: email },
    { label: 'Senha temporaria', value: `<span style="background-color:#e2e8f0;padding:4px 12px;font-family:Courier New,monospace;">${senhaTemporaria}</span>` }
])}

<!-- Botao de acesso -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
<tr>
<td align="center">
${bulletproofButton(urlLogin, 'Acessar o Sistema', PRIMARY_COLOR)}
</td>
</tr>
</table>

${infoBox('#fee2e2', '#ef4444', '#991b1b', '<strong>Seguranca:</strong> Recomendamos que voce altere sua senha apos o primeiro login.')}

<p style="margin:25px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
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
<h2 style="margin:0 0 20px 0;color:${PRIMARY_COLOR};font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Verifique seu Email
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Obrigado por se registrar no ${APP_NAME}! Para ativar sua conta,
clique no botao abaixo para verificar seu endereco de email:
</p>

<!-- Botao de verificacao -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
<tr>
<td align="center">
${bulletproofButton(urlVerificacao, 'Verificar Email', '#059669')}
</td>
</tr>
</table>

<p style="margin:20px 0;color:#64748b;font-size:13px;text-align:center;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ou copie e cole o link abaixo no seu navegador:
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 25px 0;">
<tr>
<td align="center" style="padding:12px 16px;background-color:#f1f5f9;word-break:break-all;">
<a href="${urlVerificacao}" style="color:#3b82f6;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;text-decoration:none;">
${urlVerificacao}
</a>
</td>
</tr>
</table>

${infoBox('#dbeafe', '#3b82f6', '#1e40af', '<strong>Atencao:</strong> Este link expira em <strong>24 horas</strong>.')}

<p style="margin:25px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
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
<h2 style="margin:0 0 20px 0;color:#dc2626;font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Novo Login Detectado
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Detectamos um novo acesso a sua conta no ${APP_NAME}.
Confira os detalhes abaixo:
</p>

<!-- Detalhes do login -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fef2f2;border:1px solid #fecaca;margin:25px 0;">
<tr>
<td style="padding:25px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="padding:8px 0;">
<span style="color:#64748b;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">Endereco IP:</span>
<strong style="color:#991b1b;font-size:15px;margin-left:10px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">${info.ip}</strong>
</td>
</tr>
<tr>
<td style="padding:8px 0;">
<span style="color:#64748b;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">Navegador:</span>
<strong style="color:#991b1b;font-size:15px;margin-left:10px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">${info.userAgent}</strong>
</td>
</tr>
<tr>
<td style="padding:8px 0;">
<span style="color:#64748b;font-size:13px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">Data/Hora:</span>
<strong style="color:#991b1b;font-size:15px;margin-left:10px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">${info.dataHora}</strong>
</td>
</tr>
</table>
</td>
</tr>
</table>

${infoBox('#fee2e2', '#ef4444', '#991b1b', '<strong>Nao foi voce?</strong> Altere sua senha imediatamente e entre em contato com o administrador.')}
    `;

    return baseLayout(content);
};

/**
 * Template para redefinicao de senha com link
 */
const templateResetSenhaLink = (nomeUsuario, urlReset) => {
    const content = `
<h2 style="margin:0 0 20px 0;color:${PRIMARY_COLOR};font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Redefinicao de Senha
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Recebemos uma solicitacao para redefinir a senha da sua conta no ${APP_NAME}.
Clique no botao abaixo para criar uma nova senha:
</p>

<!-- Botao de reset -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0;">
<tr>
<td align="center">
${bulletproofButton(urlReset, 'Redefinir Minha Senha', '#dc2626')}
</td>
</tr>
</table>

<p style="margin:20px 0;color:#64748b;font-size:13px;text-align:center;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ou copie e cole o link abaixo no seu navegador:
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;margin:0 0 25px 0;">
<tr>
<td align="center" style="padding:12px 16px;word-break:break-all;">
<a href="${urlReset}" style="color:#3b82f6;font-size:12px;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;text-decoration:none;">
${urlReset}
</a>
</td>
</tr>
</table>

${infoBox('#fef3c7', '#f59e0b', '#92400e', '<strong>Importante:</strong> Este link expira em <strong>1 hora</strong>. Apos esse periodo, voce precisara solicitar um novo link.')}

<p style="margin:25px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
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
<h2 style="margin:0 0 20px 0;color:#059669;font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Verificacao de Email
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Para verificar seu email no ${APP_NAME}, utilize o codigo abaixo:
</p>

${otpBox(codigoOtp, '#d1fae5', '#065f46')}

${infoBox('#fef3c7', '#f59e0b', '#92400e', '<strong>Importante:</strong> Este codigo expira em <strong>15 minutos</strong>. Nao compartilhe este codigo com ninguem.')}

<p style="margin:25px 0 0 0;color:#64748b;font-size:14px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
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
<h2 style="margin:0 0 20px 0;color:#059669;font-size:22px;font-weight:600;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Senha Alterada com Sucesso
</h2>

<p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Ola <strong>${nomeUsuario}</strong>,
</p>

<p style="margin:0 0 25px 0;color:#475569;font-size:15px;line-height:1.6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
Sua senha no ${APP_NAME} foi alterada com sucesso em
<strong>${new Date().toLocaleString('pt-BR')}</strong>.
</p>

${infoBox('#d1fae5', '#10b981', '#065f46', 'Se voce realizou esta alteracao, nenhuma acao adicional e necessaria.')}

${infoBox('#fee2e2', '#ef4444', '#991b1b', '<strong>Nao foi voce?</strong> Entre em contato imediatamente com o administrador do sistema.')}
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
