const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');

// Registrar novo usuario
exports.register = async (req, res) => {
    try {
        const { usuario, email, senha } = req.body;

        // Verificar se usuario ou email ja existem
        const usuarioExistente = await User.findOne({
            $or: [{ email }, { usuario }]
        });

        if (usuarioExistente) {
            return res.status(400).json({
                message: usuarioExistente.email === email
                    ? 'Email ja cadastrado'
                    : 'Nome de usuario ja existe'
            });
        }

        // Criar usuario (sem perfil - admin deve atribuir depois)
        const user = new User({
            usuario,
            email,
            senha,
            perfil: null,
            ativo: true,
            emailVerificado: false
        });

        // Gerar token de verificacao de email
        const tokenVerificacao = user.gerarTokenVerificacao();
        await user.save();

        // Enviar email de verificacao
        try {
            await emailService.enviarEmailVerificacao(user, tokenVerificacao);
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
            // Nao falha o registro se email falhar
        }

        // Log de auditoria
        await auditService.logAuth(req, 'REGISTRO', `Novo usuario registrado: ${user.usuario}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario,
            metadados: { email: user.email }
        });

        res.status(201).json({
            message: 'Usuario registrado com sucesso. Verifique seu email.',
            user: {
                id: user._id,
                usuario: user.usuario,
                email: user.email,
                perfil: user.perfil
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { usuario, senha } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';

        // Buscar usuario com senha e popular perfil
        const user = await User.findOne({
            $or: [{ usuario }, { email: usuario }]
        })
            .select('+senha +bloqueadoAte +tentativasLogin')
            .populate('perfil', 'nome permissoes isAdmin');

        if (!user) {
            // Log de tentativa de login com usuario inexistente
            await auditService.logAuth(req, 'LOGIN_FALHA', `Tentativa de login com usuario inexistente: ${usuario}`, {
                sucesso: false,
                metadados: { usuarioTentativa: usuario }
            });
            return res.status(401).json({ message: 'Credenciais invalidas' });
        }

        // Verificar se conta esta bloqueada
        if (user.bloqueadoAte && user.bloqueadoAte > Date.now()) {
            const minutosRestantes = Math.ceil((user.bloqueadoAte - Date.now()) / 60000);
            await auditService.logAuth(req, 'LOGIN_BLOQUEADO', `Tentativa de login em conta bloqueada: ${user.usuario}`, {
                sucesso: false,
                usuarioId: user._id,
                usuarioNome: user.usuario,
                nivel: 'WARN',
                metadados: { minutosRestantes }
            });
            return res.status(423).json({
                message: `Conta bloqueada. Tente novamente em ${minutosRestantes} minutos.`
            });
        }

        // Verificar senha
        const senhaCorreta = await user.compararSenha(senha);

        if (!senhaCorreta) {
            // Incrementar tentativas de login falhas
            user.tentativasLogin = (user.tentativasLogin || 0) + 1;

            // Bloquear apos 5 tentativas
            if (user.tentativasLogin >= 5) {
                user.bloqueadoAte = Date.now() + 15 * 60 * 1000; // 15 minutos
                user.tentativasLogin = 0;
                await auditService.logAuth(req, 'LOGIN_BLOQUEADO', `Conta bloqueada apos 5 tentativas falhas: ${user.usuario}`, {
                    sucesso: false,
                    usuarioId: user._id,
                    usuarioNome: user.usuario,
                    nivel: 'CRITICAL'
                });
            } else {
                await auditService.logAuth(req, 'LOGIN_FALHA', `Senha incorreta para usuario: ${user.usuario}`, {
                    sucesso: false,
                    usuarioId: user._id,
                    usuarioNome: user.usuario,
                    metadados: { tentativasRestantes: 5 - user.tentativasLogin }
                });
            }

            await user.save();
            return res.status(401).json({ message: 'Credenciais invalidas' });
        }

        // Verificar se usuario esta ativo
        if (!user.ativo) {
            return res.status(403).json({ message: 'Conta desativada. Contate o administrador.' });
        }

        // Verificar se email foi verificado (opcional - pode ser configuravel)
        if (!user.emailVerificado && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            return res.status(403).json({
                message: 'Email nao verificado. Verifique sua caixa de entrada.',
                code: 'EMAIL_NOT_VERIFIED'
            });
        }

        // Resetar tentativas de login e atualizar ultimo login
        user.tentativasLogin = 0;
        user.bloqueadoAte = null;
        user.ultimoLogin = new Date();
        await user.save();

        // Gerar tokens
        const tokens = await authService.gerarTokens(user, ipAddress, userAgent);

        // Log de auditoria - login bem-sucedido
        await auditService.logAuth(req, 'LOGIN_SUCESSO', `Login realizado: ${user.usuario}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario,
            metadados: { perfil: user.perfil?.nome }
        });

        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user._id,
                usuario: user.usuario,
                nome: user.nome,
                email: user.email,
                fotoPerfil: user.fotoPerfil,
                perfil: user.perfil,
                emailVerificado: user.emailVerificado
            },
            ...tokens
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Logout
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        if (refreshToken) {
            await authService.revogarToken(refreshToken, ipAddress);
        }

        // Log de auditoria
        await auditService.logAuth(req, 'LOGOUT', 'Logout realizado');

        res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Logout de todos dispositivos
exports.logoutAll = async (req, res) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.revogarTodosTokens(req.user.id, ipAddress);

        // Log de auditoria
        await auditService.logAuth(req, 'LOGOUT_TODOS', 'Logout de todos os dispositivos', {
            nivel: 'WARN'
        });

        res.json({ message: 'Logout realizado em todos os dispositivos' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token e obrigatorio' });
        }

        const tokens = await authService.atualizarTokens(refreshToken, ipAddress, userAgent);

        res.json(tokens);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

// Verificar Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Hash do token para comparar
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            tokenVerificacaoEmail: hashedToken,
            tokenVerificacaoExpira: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token invalido ou expirado' });
        }

        user.emailVerificado = true;
        user.tokenVerificacaoEmail = undefined;
        user.tokenVerificacaoExpira = undefined;
        await user.save();

        // Log de auditoria
        await auditService.logAuth(req, 'EMAIL_VERIFICADO', `Email verificado: ${user.email}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario
        });

        res.json({ message: 'Email verificado com sucesso! Voce ja pode fazer login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reenviar Email de Verificacao
exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            // Por seguranca, nao revela se email existe
            return res.json({ message: 'Se o email existir, um link de verificacao sera enviado.' });
        }

        if (user.emailVerificado) {
            return res.status(400).json({ message: 'Email ja verificado' });
        }

        const tokenVerificacao = user.gerarTokenVerificacao();
        await user.save();

        await emailService.enviarEmailVerificacao(user, tokenVerificacao);

        res.json({ message: 'Email de verificacao reenviado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Forgot Password (link tradicional)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        // Por seguranca, sempre retorna sucesso mesmo se email nao existe
        if (!user) {
            return res.json({
                message: 'Se o email existir, um link de recuperacao sera enviado.'
            });
        }

        const tokenReset = user.gerarTokenResetSenha();
        await user.save();

        await emailService.enviarEmailResetSenha(user, tokenReset);

        res.json({ message: 'Email de recuperacao enviado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Solicitar OTP para redefinicao de senha
exports.solicitarOtpResetSenha = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email e obrigatorio' });
        }

        const user = await User.findOne({ email });

        // Por seguranca, sempre retorna sucesso mesmo se email nao existe
        if (!user) {
            return res.json({
                message: 'Se o email estiver cadastrado, voce recebera um codigo de verificacao.'
            });
        }

        // Verificar se usuario esta ativo
        if (!user.ativo) {
            return res.json({
                message: 'Se o email estiver cadastrado, voce recebera um codigo de verificacao.'
            });
        }

        // Gerar codigo OTP
        const codigoOtp = user.gerarCodigoOtp();
        await user.save();

        // Enviar email com codigo OTP
        try {
            await emailService.enviarOtpResetSenha(user, codigoOtp);
        } catch (emailError) {
            console.error('Erro ao enviar email OTP:', emailError);
            return res.status(500).json({ message: 'Erro ao enviar email. Tente novamente.' });
        }

        // Log de auditoria
        await auditService.logAuth(req, 'OTP_SOLICITADO', `OTP solicitado para reset de senha: ${user.email}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario,
            nivel: 'WARN'
        });

        res.json({
            message: 'Codigo de verificacao enviado para seu email.',
            expiresIn: '15 minutos'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verificar OTP e redefinir senha
exports.verificarOtpResetSenha = async (req, res) => {
    try {
        const { email, otp, novaSenha } = req.body;

        if (!email || !otp || !novaSenha) {
            return res.status(400).json({
                message: 'Email, codigo OTP e nova senha sao obrigatorios'
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                message: 'A nova senha deve ter no minimo 6 caracteres'
            });
        }

        // Buscar usuario com campos OTP
        const user = await User.findOne({ email }).select('+otpCode +otpExpira');

        if (!user) {
            return res.status(400).json({ message: 'Codigo invalido ou expirado' });
        }

        // Verificar OTP
        const otpValido = user.verificarOtp(otp);

        if (!otpValido) {
            return res.status(400).json({ message: 'Codigo invalido ou expirado' });
        }

        // Atualizar senha
        user.senha = novaSenha;
        user.otpCode = undefined;
        user.otpExpira = undefined;
        user.tentativasLogin = 0;
        user.bloqueadoAte = null;
        await user.save();

        // Revogar todos os refresh tokens por seguranca
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.revogarTodosTokens(user._id, ipAddress);

        // Enviar email de confirmacao
        try {
            await emailService.enviarConfirmacaoSenhaAlterada(user);
        } catch (emailError) {
            console.error('Erro ao enviar confirmacao:', emailError);
        }

        // Log de auditoria
        await auditService.logAuth(req, 'SENHA_RESET', `Senha redefinida via OTP: ${user.usuario}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario,
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { senha } = req.body;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            tokenResetSenha: hashedToken,
            tokenResetExpira: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Token invalido ou expirado' });
        }

        // Atualizar senha
        user.senha = senha;
        user.tokenResetSenha = undefined;
        user.tokenResetExpira = undefined;
        user.tentativasLogin = 0;
        user.bloqueadoAte = null;
        await user.save();

        // Revogar todos os refresh tokens por seguranca
        const ipAddress = req.ip || req.connection.remoteAddress;
        await authService.revogarTodosTokens(user._id, ipAddress);

        // Log de auditoria
        await auditService.logAuth(req, 'SENHA_RESET', `Senha redefinida via token: ${user.usuario}`, {
            usuarioId: user._id,
            usuarioNome: user.usuario,
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obter perfil do usuario autenticado
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('perfil', 'nome permissoes isAdmin');

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        res.json({
            id: user._id,
            usuario: user.usuario,
            nome: user.nome,
            email: user.email,
            fotoPerfil: user.fotoPerfil,
            perfil: user.perfil,
            emailVerificado: user.emailVerificado,
            ultimoLogin: user.ultimoLogin,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Atualizar perfil do usuario autenticado
exports.updateProfile = async (req, res) => {
    try {
        const { nome, email } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        // Verificar se email ja existe em outro usuario
        if (email && email !== user.email) {
            const emailExiste = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExiste) {
                return res.status(400).json({ message: 'Email ja cadastrado' });
            }
            user.email = email;
        }

        if (nome !== undefined) {
            user.nome = nome;
        }

        await user.save();

        // Popular perfil para retornar
        await user.populate('perfil', 'nome permissoes isAdmin');

        res.json({
            message: 'Perfil atualizado com sucesso',
            user: {
                id: user._id,
                usuario: user.usuario,
                nome: user.nome,
                email: user.email,
                fotoPerfil: user.fotoPerfil,
                perfil: user.perfil,
                emailVerificado: user.emailVerificado
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Atualizar foto de perfil do usuario autenticado
exports.updateProfilePhoto = async (req, res) => {
    try {
        const { fotoPerfil } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        // Validar tamanho da imagem base64 (max 500KB)
        if (fotoPerfil && fotoPerfil.length > 700000) {
            return res.status(400).json({ message: 'Imagem muito grande. Maximo 500KB.' });
        }

        user.fotoPerfil = fotoPerfil || null;
        await user.save();

        res.json({
            message: 'Foto de perfil atualizada com sucesso',
            fotoPerfil: user.fotoPerfil
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Alterar senha do usuario autenticado
exports.changePassword = async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ message: 'Senha atual e nova senha sao obrigatorias' });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({ message: 'Nova senha deve ter no minimo 6 caracteres' });
        }

        const user = await User.findById(req.user.id).select('+senha');

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        // Verificar senha atual
        const senhaCorreta = await user.compararSenha(senhaAtual);
        if (!senhaCorreta) {
            return res.status(400).json({ message: 'Senha atual incorreta' });
        }

        user.senha = novaSenha;
        await user.save();

        // Log de auditoria
        await auditService.logAuth(req, 'SENHA_ALTERADA', 'Senha alterada pelo usuario', {
            nivel: 'WARN'
        });

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar sessoes ativas
exports.getSessions = async (req, res) => {
    try {
        const sessions = await authService.listarSessoesAtivas(req.user.id);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Solicitar OTP para verificacao de email (usuario autenticado)
exports.solicitarOtpVerificacaoEmail = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        if (user.emailVerificado) {
            return res.status(400).json({ message: 'Email ja verificado' });
        }

        // Gerar codigo OTP
        const codigoOtp = user.gerarCodigoOtp();
        await user.save();

        // Enviar email com codigo OTP
        try {
            await emailService.enviarOtpVerificacaoEmail(user, codigoOtp);
        } catch (emailError) {
            console.error('Erro ao enviar email OTP:', emailError);
            return res.status(500).json({ message: 'Erro ao enviar email. Tente novamente.' });
        }

        res.json({
            message: 'Codigo de verificacao enviado para seu email.',
            expiresIn: '15 minutos'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verificar OTP e confirmar email (usuario autenticado)
exports.verificarOtpEmail = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ message: 'Codigo OTP e obrigatorio' });
        }

        // Buscar usuario com campos OTP
        const user = await User.findById(req.user.id).select('+otpCode +otpExpira');

        if (!user) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        if (user.emailVerificado) {
            return res.status(400).json({ message: 'Email ja verificado' });
        }

        // Verificar OTP
        const otpValido = user.verificarOtp(otp);

        if (!otpValido) {
            return res.status(400).json({ message: 'Codigo invalido ou expirado' });
        }

        // Marcar email como verificado
        user.emailVerificado = true;
        user.otpCode = undefined;
        user.otpExpira = undefined;
        await user.save();

        // Log de auditoria
        await auditService.logAuth(req, 'EMAIL_VERIFICADO', 'Email verificado via OTP');

        res.json({
            message: 'Email verificado com sucesso!',
            emailVerificado: true
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
