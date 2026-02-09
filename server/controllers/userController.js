const { Op } = require('sequelize');
const { User, Perfil, PerfilPermissao } = require('../models');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');

// Helper para formatar perfil com permissoes do junction table
const formatPerfilComPermissoes = (perfil) => {
    if (!perfil) return null;
    return {
        id: perfil.id,
        nome: perfil.nome,
        is_admin: perfil.is_admin,
        permissoes: perfil.permissoesRef ? perfil.permissoesRef.map(p => p.permissao) : []
    };
};

// Include padrao para perfil com permissoes
const perfilInclude = [
    {
        model: Perfil,
        as: 'perfil',
        include: [{ model: PerfilPermissao, as: 'permissoesRef' }]
    }
];

// Listar todos os usuarios
exports.getAll = async (req, res) => {
    try {
        const { ativo, perfil, busca } = req.query;

        let where = {};

        // Filtrar por status ativo
        if (ativo !== undefined) {
            where.ativo = ativo === 'true';
        }

        // Filtrar por perfil
        if (perfil) {
            where.perfil_id = perfil;
        }

        // Busca por usuario ou email
        if (busca) {
            where[Op.or] = [
                { usuario: { [Op.like]: `%${busca}%` } },
                { email: { [Op.like]: `%${busca}%` } }
            ];
        }

        const usuarios = await User.findAll({
            where,
            include: perfilInclude,
            order: [['created_at', 'DESC']]
        });

        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar usuario por ID
exports.getById = async (req, res) => {
    try {
        const usuario = await User.findByPk(req.params.id, {
            include: perfilInclude
        });

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
        const { usuario, email, perfil, ativo, enviarEmail } = req.body;

        // Verificar se usuario ou email ja existem
        const usuarioExistente = await User.findOne({
            where: {
                [Op.or]: [{ email }, { usuario }]
            }
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
            const perfilExistente = await Perfil.findByPk(perfil);
            if (!perfilExistente) {
                return res.status(400).json({ message: 'Perfil nao encontrado' });
            }
            if (!perfilExistente.ativo) {
                return res.status(400).json({ message: 'Perfil esta desativado' });
            }
        }

        // Criar usuario sem senha - usuario vai definir ao ativar a conta
        const novoUsuario = await User.create({
            usuario,
            email,
            perfil_id: perfil || null,
            ativo: ativo !== undefined ? ativo : true,
            conta_ativada: false, // Conta nao ativada ate usuario definir senha
            email_verificado: false
        });

        // Gerar token de ativacao de conta
        const tokenAtivacao = novoUsuario.gerarTokenAtivacaoConta();
        await novoUsuario.save();

        // Enviar email com link para definir senha (se habilitado)
        let emailEnviado = false;
        if (enviarEmail !== false) {
            try {
                await emailService.enviarEmailAtivacaoConta(novoUsuario, tokenAtivacao);
                emailEnviado = true;
            } catch (emailError) {
                console.error('Erro ao enviar email de ativacao:', emailError);
                // Nao falha a criacao se o email falhar
            }
        }

        // Retornar com perfil populado
        const usuarioResponse = await User.findByPk(novoUsuario.id, {
            include: perfilInclude
        });

        // Buscar nome do perfil para auditoria
        let perfilNome = null;
        if (perfil) {
            const perfilDoc = await Perfil.findByPk(perfil, { attributes: ['nome'] });
            perfilNome = perfilDoc?.nome || null;
        }

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'USUARIO', 'User', {
            recursoId: novoUsuario.id,
            recursoNome: novoUsuario.usuario,
            descricao: `Usuario criado: ${novoUsuario.usuario}`,
            dadosNovos: {
                usuario,
                email,
                perfil: perfilNome ? `${perfilNome} (${perfil})` : null,
                ativo: ativo !== undefined ? ativo : true
            }
        });

        res.status(201).json({
            message: 'Usuario criado com sucesso. Um email foi enviado para definir a senha.',
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
        const usuarioExistente = await User.findByPk(userId);
        if (!usuarioExistente) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        // Verificar duplicidade de usuario/email
        if (usuario || email) {
            const orConditions = [];
            if (email) orConditions.push({ email });
            if (usuario) orConditions.push({ usuario });

            const duplicado = await User.findOne({
                where: {
                    id: { [Op.ne]: userId },
                    [Op.or]: orConditions
                }
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
            const perfilExistente = await Perfil.findByPk(perfil);
            if (!perfilExistente) {
                return res.status(400).json({ message: 'Perfil nao encontrado' });
            }
        }

        // Atualizar campos permitidos
        const camposAtualizar = {};
        if (usuario) camposAtualizar.usuario = usuario;
        if (email) camposAtualizar.email = email;
        if (perfil !== undefined) camposAtualizar.perfil_id = perfil || null;
        if (ativo !== undefined) camposAtualizar.ativo = ativo;

        // Buscar nomes dos perfis para auditoria
        let perfilAnteriorNome = null;
        let perfilNovoNome = null;

        if (usuarioExistente.perfil_id) {
            const perfilAnteriorDoc = await Perfil.findByPk(usuarioExistente.perfil_id, { attributes: ['nome'] });
            perfilAnteriorNome = perfilAnteriorDoc?.nome || null;
        }

        if (perfil) {
            const perfilNovoDoc = await Perfil.findByPk(perfil, { attributes: ['nome'] });
            perfilNovoNome = perfilNovoDoc?.nome || null;
        }

        // Dados anteriores para auditoria
        const dadosAnteriores = {
            usuario: usuarioExistente.usuario,
            email: usuarioExistente.email,
            perfil: perfilAnteriorNome ? `${perfilAnteriorNome} (${usuarioExistente.perfil_id})` : null,
            ativo: usuarioExistente.ativo
        };

        await User.update(camposAtualizar, { where: { id: userId } });

        const usuarioAtualizado = await User.findByPk(userId, {
            include: perfilInclude
        });

        // Preparar dados novos para auditoria
        const dadosNovosAuditoria = { ...camposAtualizar };
        if (perfil !== undefined) {
            dadosNovosAuditoria.perfil = perfilNovoNome ? `${perfilNovoNome} (${perfil})` : null;
            delete dadosNovosAuditoria.perfil_id;
        }

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'USUARIO', 'User', {
            recursoId: userId,
            recursoNome: usuarioAtualizado.usuario,
            descricao: `Usuario atualizado: ${usuarioAtualizado.usuario}`,
            dadosAnteriores,
            dadosNovos: dadosNovosAuditoria
        });

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

        const usuario = await User.findByPk(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        await User.destroy({ where: { id: userId } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'USUARIO', 'User', {
            recursoId: userId,
            recursoNome: usuario.usuario,
            descricao: `Usuario excluido: ${usuario.usuario}`,
            dadosAnteriores: { usuario: usuario.usuario, email: usuario.email },
            nivel: 'CRITICAL'
        });

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

        const usuario = await User.scope('withSenha').findByPk(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        usuario.senha = novaSenha;
        await usuario.save();

        // Log de auditoria
        await auditService.logCrud(req, 'SENHA_RESET', 'USUARIO', 'User', {
            recursoId: userId,
            recursoNome: usuario.usuario,
            descricao: `Senha redefinida por admin: ${usuario.usuario}`,
            nivel: 'CRITICAL'
        });

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

        const usuario = await User.findByPk(userId);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario nao encontrado' });
        }

        const ativoAnterior = usuario.ativo;
        usuario.ativo = !usuario.ativo;
        await usuario.save();

        // Log de auditoria
        await auditService.logCrud(req, usuario.ativo ? 'ATIVAR' : 'DESATIVAR', 'USUARIO', 'User', {
            recursoId: userId,
            recursoNome: usuario.usuario,
            descricao: `Usuario ${usuario.ativo ? 'ativado' : 'desativado'}: ${usuario.usuario}`,
            dadosAnteriores: { ativo: ativoAnterior },
            dadosNovos: { ativo: usuario.ativo },
            nivel: 'WARN'
        });

        res.json({
            message: `Usuario ${usuario.ativo ? 'ativado' : 'desativado'} com sucesso`,
            ativo: usuario.ativo
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
