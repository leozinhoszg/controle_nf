const { Perfil, User } = require('../models');

// Listar todos os perfis
exports.getAll = async (req, res) => {
    try {
        const { ativo } = req.query;

        let filtro = {};
        if (ativo !== undefined) {
            filtro.ativo = ativo === 'true';
        }

        const perfis = await Perfil.find(filtro).sort({ nome: 1 });
        res.json(perfis);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar perfil por ID
exports.getById = async (req, res) => {
    try {
        const perfil = await Perfil.findById(req.params.id);
        if (!perfil) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }
        res.json(perfil);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo perfil
exports.create = async (req, res) => {
    try {
        const { nome, descricao, permissoes, isAdmin, ativo } = req.body;

        // Verificar se nome ja existe
        const perfilExistente = await Perfil.findOne({ nome });
        if (perfilExistente) {
            return res.status(400).json({ message: 'Ja existe um perfil com este nome' });
        }

        const perfil = new Perfil({
            nome,
            descricao,
            permissoes: permissoes || [],
            isAdmin: isAdmin || false,
            ativo: ativo !== undefined ? ativo : true
        });

        await perfil.save();

        res.status(201).json({
            message: 'Perfil criado com sucesso',
            perfil
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
        const perfilExistente = await Perfil.findById(perfilId);
        if (!perfilExistente) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }

        // Verificar duplicidade de nome
        if (nome && nome !== perfilExistente.nome) {
            const duplicado = await Perfil.findOne({ nome, _id: { $ne: perfilId } });
            if (duplicado) {
                return res.status(400).json({ message: 'Ja existe um perfil com este nome' });
            }
        }

        const camposAtualizar = {};
        if (nome) camposAtualizar.nome = nome;
        if (descricao !== undefined) camposAtualizar.descricao = descricao;
        if (permissoes !== undefined) camposAtualizar.permissoes = permissoes;
        if (isAdmin !== undefined) camposAtualizar.isAdmin = isAdmin;
        if (ativo !== undefined) camposAtualizar.ativo = ativo;

        const perfilAtualizado = await Perfil.findByIdAndUpdate(
            perfilId,
            camposAtualizar,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Perfil atualizado com sucesso',
            perfil: perfilAtualizado
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir perfil
exports.delete = async (req, res) => {
    try {
        const perfilId = req.params.id;

        const perfil = await Perfil.findById(perfilId);
        if (!perfil) {
            return res.status(404).json({ message: 'Perfil nao encontrado' });
        }

        // Verificar se ha usuarios usando este perfil
        const usuariosComPerfil = await User.countDocuments({ perfil: perfilId });
        if (usuariosComPerfil > 0) {
            return res.status(400).json({
                message: `Nao e possivel excluir. ${usuariosComPerfil} usuario(s) estao usando este perfil.`
            });
        }

        await Perfil.findByIdAndDelete(perfilId);

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
            { id: 'perfis', nome: 'Perfis', descricao: 'Gerenciar perfis de acesso' }
        ];

        res.json(permissoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
