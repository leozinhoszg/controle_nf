const { User, Perfil } = require('../models');
const emailService = require('../services/emailService');

// Listar todos os usuarios
exports.getAll = async (req, res) => {
    try {
        const { ativo, perfil, busca } = req.query;

        let filtro = {};

        // Filtrar por status ativo
        if (ativo !== undefined) {
            filtro.ativo = ativo === 'true';
        }

        // Filtrar por perfil
        if (perfil) {
            filtro.perfil = perfil;
        }

        // Busca por usuario ou email
        if (busca) {
            filtro.$or = [
                { usuario: { $regex: busca, $options: 'i' } },
                { email: { $regex: busca, $options: 'i' } }
            ];
        }

        const usuarios = await User.find(filtro)
            .select('-tokenVerificacaoEmail -tokenVerificacaoExpira -tokenResetSenha -tokenResetExpira -tentativasLogin -bloqueadoAte')
            .populate('perfil', 'nome permissoes isAdmin')
            .sort({ createdAt: -1 });

        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar usuario por ID
exports.getById = async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id)
            .select('-tokenVerificacaoEmail -tokenVerificacaoExpira -tokenResetSenha -tokenResetExpira -tentativasLogin -bloqueadoAte')
            .populate('perfil', 'nome permissoes isAdmin');

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo usuario
exports.create = async (req, res) => {
    try {
        const { usuario, email, senha, perfil, ativo, enviarEmail } = req.body;

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

        // Verificar se perfil existe
        if (perfil) {
            const perfilExistente = await Perfil.findById(perfil);
            if (!perfilExistente) {
                return res.status(400).json({ message: 'Perfil nao encontrado' });
            }
            if (!perfilExistente.ativo) {
                return res.status(400).json({ message: 'Perfil esta desativado' });
            }
        }

        // Guardar senha original para envio por email
        const senhaOriginal = senha;

        // Criar usuario
        const novoUsuario = new User({
            usuario,
            email,
            senha,
            perfil: perfil || null,
            ativo: ativo !== undefined ? ativo : true,
            emailVerificado: false // Usuario deve verificar email apos primeiro login
        });

        await novoUsuario.save();

        // Enviar email de boas-vindas com credenciais (se habilitado)
        let emailEnviado = false;
        if (enviarEmail !== false) {
            try {
                await emailService.enviarEmailNovoUsuario(novoUsuario, senhaOriginal);
                emailEnviado = true;
            } catch (emailError) {
                console.error('Erro ao enviar email de boas-vindas:', emailError);
                // Nao falha a criacao se o email falhar
            }
        }

        // Retornar com perfil populado
        const usuarioResponse = await User.findById(novoUsuario._id)
            .select('-tokenVerificacaoEmail -tokenVerificacaoExpira -tokenResetSenha -tokenResetExpira -tentativasLogin -bloqueadoAte')
            .populate('perfil', 'nome permissoes isAdmin');

        res.status(201).json({
            message: 'Usuario criado com sucesso',
            usuario: usuarioResponse,
            emailEnviado
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar usuario
exports.update = async (req, res) => {
    try {
        const { usuario, email, perfil, ativo } = req.body;
        const userId = req.params.id;

        // Verificar se usuario existe
        const usuarioExistente = await User.findById(userId);
        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        // Verificar duplicidade de usuario/email
        if (usuario || email) {
            const duplicado = await User.findOne({
                _id: { $ne: userId },
                $or: [
                    ...(email ? [{ email }] : []),
                    ...(usuario ? [{ usuario }] : [])
                ]
            });

            if (duplicado) {
                return res.status(400).json({
                    message: duplicado.email === email
                        ? 'Email ja cadastrado por outro usuario'
                        : 'Nome de usuario ja existe'
                });
            }
        }

        // Verificar se perfil existe
        if (perfil) {
            const perfilExistente = await Perfil.findById(perfil);
            if (!perfilExistente) {
                return res.status(400).json({ message: 'Perfil nao encontrado' });
            }
        }

        // Atualizar campos permitidos
        const camposAtualizar = {};
        if (usuario) camposAtualizar.usuario = usuario;
        if (email) camposAtualizar.email = email;
        if (perfil !== undefined) camposAtualizar.perfil = perfil || null;
        if (ativo !== undefined) camposAtualizar.ativo = ativo;

        const usuarioAtualizado = await User.findByIdAndUpdate(
            userId,
            camposAtualizar,
            { new: true, runValidators: true }
        )
            .select('-tokenVerificacaoEmail -tokenVerificacaoExpira -tokenResetSenha -tokenResetExpira -tentativasLogin -bloqueadoAte')
            .populate('perfil', 'nome permissoes isAdmin');

        res.json({
            message: 'Usuario atualizado com sucesso',
            usuario: usuarioAtualizado
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir usuario
exports.delete = async (req, res) => {
    try {
        const userId = req.params.id;

        // Nao permitir excluir a si mesmo
        if (req.user.id === userId) {
            return res.status(400).json({ message: 'Voce nao pode excluir sua propria conta' });
        }

        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: 'Usuario excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Alterar senha de usuario
exports.alterarSenha = async (req, res) => {
    try {
        const { novaSenha } = req.body;
        const userId = req.params.id;

        if (!novaSenha || novaSenha.length < 6) {
            return res.status(400).json({ message: 'Senha deve ter no minimo 6 caracteres' });
        }

        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        usuario.senha = novaSenha;
        await usuario.save();

        res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Ativar/Desativar usuario
exports.toggleAtivo = async (req, res) => {
    try {
        const userId = req.params.id;

        // Nao permitir desativar a si mesmo
        if (req.user.id === userId) {
            return res.status(400).json({ message: 'Voce nao pode desativar sua propria conta' });
        }

        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        usuario.ativo = !usuario.ativo;
        await usuario.save();

        res.json({
            message: `Usuario ${usuario.ativo ? 'ativado' : 'desativado'} com sucesso`,
            ativo: usuario.ativo
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
