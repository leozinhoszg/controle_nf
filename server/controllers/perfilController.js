const { Op } = require('sequelize');
const { Perfil, PerfilPermissao, User } = require('../models');
const auditService = require('../services/auditService');

// Helper para formatar perfil com permissoes do junction table
const formatPerfil = (perfil) => {
    if (!perfil) return null;
    const plain = perfil.toJSON ? perfil.toJSON() : perfil;
    return {
        ...plain,
        isAdmin: plain.is_admin,
        is_admin: undefined,
        permissoes: plain.permissoesRef ? plain.permissoesRef.map(p => p.permissao) : [],
        permissoesRef: undefined
    };
};

// Include padrao para permissoes
const permissoesInclude = [{ model: PerfilPermissao, as: 'permissoesRef' }];

// Listar todos os perfis
exports.getAll = async (req, res) => {
    try {
        const { ativo } = req.query;

        let where = {};
        if (ativo !== undefined) {
            where.ativo = ativo === 'true';
        }

        const perfis = await Perfil.findAll({
            where,
            include: permissoesInclude,
            order: [['nome', 'ASC']]
        });

        res.json(perfis.map(formatPerfil));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar perfil por ID
exports.getById = async (req, res) => {
    try {
        const perfil = await Perfil.findByPk(req.params.id, {
            include: permissoesInclude
        });
        if (!perfil) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }
        res.json(formatPerfil(perfil));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo perfil
exports.create = async (req, res) => {
    try {
        const { nome, descricao, permissoes, isAdmin, ativo } = req.body;

        // Verificar se nome ja existe
        const perfilExistente = await Perfil.findOne({ where: { nome } });
        if (perfilExistente) {
            return res.status(400).json({ message: 'Ja existe um perfil com este nome' });
        }

        const perfil = await Perfil.create({
            nome,
            descricao,
            is_admin: isAdmin || false,
            ativo: ativo !== undefined ? ativo : true
        });

        // Criar permissoes no junction table
        if (permissoes && permissoes.length > 0) {
            await PerfilPermissao.bulkCreate(
                permissoes.map(p => ({ perfil_id: perfil.id, permissao: p }))
            );
        }

        // Recarregar com permissoes
        const perfilCompleto = await Perfil.findByPk(perfil.id, {
            include: permissoesInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'PERFIL', 'Perfil', {
            recursoId: perfil.id,
            recursoNome: perfil.nome,
            descricao: `Perfil criado: ${perfil.nome}`,
            dadosNovos: { nome, descricao, permissoes, isAdmin, ativo }
        });

        res.status(201).json({
            message: 'Perfil criado com sucesso',
            perfil: formatPerfil(perfilCompleto)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar perfil
exports.update = async (req, res) => {
    try {
        const { nome, descricao, permissoes, isAdmin, ativo } = req.body;
        const perfilId = req.params.id;

        // Verificar se perfil existe
        const perfilExistente = await Perfil.findByPk(perfilId, {
            include: permissoesInclude
        });
        if (!perfilExistente) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }

        // Verificar duplicidade de nome
        if (nome && nome !== perfilExistente.nome) {
            const duplicado = await Perfil.findOne({
                where: { nome, id: { [Op.ne]: perfilId } }
            });
            if (duplicado) {
                return res.status(400).json({ message: 'Ja existe um perfil com este nome' });
            }
        }

        // Dados anteriores para auditoria
        const permissoesAntigas = perfilExistente.permissoesRef
            ? perfilExistente.permissoesRef.map(p => p.permissao)
            : [];
        const dadosAnteriores = {
            nome: perfilExistente.nome,
            descricao: perfilExistente.descricao,
            permissoes: permissoesAntigas,
            isAdmin: perfilExistente.is_admin,
            ativo: perfilExistente.ativo
        };

        const camposAtualizar = {};
        if (nome) camposAtualizar.nome = nome;
        if (descricao !== undefined) camposAtualizar.descricao = descricao;
        if (isAdmin !== undefined) camposAtualizar.is_admin = isAdmin;
        if (ativo !== undefined) camposAtualizar.ativo = ativo;

        await perfilExistente.update(camposAtualizar);

        // Atualizar permissoes se fornecidas
        if (permissoes !== undefined) {
            // Deletar permissoes antigas
            await PerfilPermissao.destroy({ where: { perfil_id: perfilId } });
            // Criar novas permissoes
            if (permissoes.length > 0) {
                await PerfilPermissao.bulkCreate(
                    permissoes.map(p => ({ perfil_id: perfilId, permissao: p }))
                );
            }
        }

        // Recarregar com permissoes atualizadas
        const perfilAtualizado = await Perfil.findByPk(perfilId, {
            include: permissoesInclude
        });

        // Determinar acao especifica
        const permissoesAlteradas = permissoes !== undefined &&
            JSON.stringify(permissoesAntigas.sort()) !== JSON.stringify([...permissoes].sort());

        // Log de auditoria
        await auditService.logCrud(req, permissoesAlteradas ? 'ALTERAR_PERMISSOES' : 'ATUALIZAR', 'PERFIL', 'Perfil', {
            recursoId: perfilId,
            recursoNome: perfilAtualizado.nome,
            descricao: permissoesAlteradas
                ? `Permissoes alteradas no perfil: ${perfilAtualizado.nome}`
                : `Perfil atualizado: ${perfilAtualizado.nome}`,
            dadosAnteriores,
            dadosNovos: { ...camposAtualizar, permissoes },
            nivel: permissoesAlteradas ? 'CRITICAL' : 'WARN'
        });

        res.json({
            message: 'Perfil atualizado com sucesso',
            perfil: formatPerfil(perfilAtualizado)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir perfil
exports.delete = async (req, res) => {
    try {
        const perfilId = req.params.id;

        const perfil = await Perfil.findByPk(perfilId, {
            include: permissoesInclude
        });
        if (!perfil) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }

        // Verificar se ha usuarios usando este perfil
        const usuariosComPerfil = await User.count({ where: { perfil_id: perfilId } });
        if (usuariosComPerfil > 0) {
            return res.status(400).json({
                message: `Nao e possivel excluir. ${usuariosComPerfil} usuario(s) estao usando este perfil.`
            });
        }

        const permissoesAntigas = perfil.permissoesRef
            ? perfil.permissoesRef.map(p => p.permissao)
            : [];

        // Excluir permissoes do junction table
        await PerfilPermissao.destroy({ where: { perfil_id: perfilId } });

        // Excluir perfil
        await Perfil.destroy({ where: { id: perfilId } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'PERFIL', 'Perfil', {
            recursoId: perfilId,
            recursoNome: perfil.nome,
            descricao: `Perfil excluido: ${perfil.nome}`,
            dadosAnteriores: { nome: perfil.nome, permissoes: permissoesAntigas, isAdmin: perfil.is_admin },
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Perfil excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Listar permissoes disponiveis
exports.getPermissoesDisponiveis = async (req, res) => {
    try {
        const permissoes = [
            { id: 'dashboard', nome: 'Dashboard', descricao: 'Acesso ao painel principal' },
            { id: 'fornecedores', nome: 'Fornecedores', descricao: 'Gerenciar fornecedores' },
            { id: 'contratos', nome: 'Contratos', descricao: 'Gerenciar contratos' },
            { id: 'relatorio', nome: 'Relatorio', descricao: 'Visualizar relatorios' },
            { id: 'usuarios', nome: 'Usuarios', descricao: 'Gerenciar usuarios' },
            { id: 'perfis', nome: 'Perfis', descricao: 'Gerenciar perfis de acesso' },
            { id: 'auditoria', nome: 'Auditoria', descricao: 'Visualizar logs de auditoria do sistema' },
            { id: 'empresas', nome: 'Empresas', descricao: 'Gerenciar empresas' },
            { id: 'estabelecimentos', nome: 'Estabelecimentos', descricao: 'Gerenciar estabelecimentos' }
        ];

        res.json(permissoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
