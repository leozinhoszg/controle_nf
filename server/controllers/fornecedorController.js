const { Op } = require('sequelize');
const { Fornecedor, Contrato, Sequencia } = require('../models');
const auditService = require('../services/auditService');

// Listar todos os fornecedores
exports.getAll = async (req, res) => {
    try {
        const fornecedores = await Fornecedor.findAll({ order: [['nome', 'ASC']] });
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar fornecedor por ID
exports.getById = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findByPk(req.params.id);
        if (!fornecedor) {
            return res.status(404).json({ message: 'Fornecedor nao encontrado' });
        }
        res.json(fornecedor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo fornecedor
exports.create = async (req, res) => {
    try {
        const novoFornecedor = await Fornecedor.create({
            nome: req.body.nome
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'FORNECEDOR', 'Fornecedor', {
            recursoId: novoFornecedor.id,
            recursoNome: novoFornecedor.nome,
            descricao: `Fornecedor criado: ${novoFornecedor.nome}`,
            dadosNovos: { nome: novoFornecedor.nome }
        });

        res.status(201).json(novoFornecedor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar fornecedor
exports.update = async (req, res) => {
    try {
        // Buscar dados anteriores para auditoria
        const fornecedorAnterior = await Fornecedor.findByPk(req.params.id);
        if (!fornecedorAnterior) {
            return res.status(404).json({ message: 'Fornecedor nao encontrado' });
        }

        await Fornecedor.update(
            { nome: req.body.nome },
            { where: { id: req.params.id } }
        );

        const fornecedor = await Fornecedor.findByPk(req.params.id);

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'FORNECEDOR', 'Fornecedor', {
            recursoId: fornecedor.id,
            recursoNome: fornecedor.nome,
            descricao: `Fornecedor atualizado: ${fornecedor.nome}`,
            dadosAnteriores: { nome: fornecedorAnterior.nome },
            dadosNovos: { nome: fornecedor.nome }
        });

        res.json(fornecedor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir fornecedor (cascata)
exports.delete = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findByPk(req.params.id);
        if (!fornecedor) {
            return res.status(404).json({ message: 'Fornecedor nao encontrado' });
        }

        // Buscar contratos do fornecedor
        const contratos = await Contrato.findAll({ where: { fornecedor_id: req.params.id } });
        const contratoIds = contratos.map(c => c.id);

        // Excluir sequencias dos contratos
        if (contratoIds.length > 0) {
            await Sequencia.destroy({ where: { contrato_id: { [Op.in]: contratoIds } } });
        }

        // Excluir contratos
        await Contrato.destroy({ where: { fornecedor_id: req.params.id } });

        // Excluir fornecedor
        await Fornecedor.destroy({ where: { id: req.params.id } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'FORNECEDOR', 'Fornecedor', {
            recursoId: req.params.id,
            recursoNome: fornecedor.nome,
            descricao: `Fornecedor excluido em cascata: ${fornecedor.nome}`,
            dadosAnteriores: { nome: fornecedor.nome },
            metadados: {
                contratosExcluidos: contratos.length,
                sequenciasExcluidas: contratoIds.length > 0 ? 'sim' : 'nao'
            },
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Fornecedor excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
