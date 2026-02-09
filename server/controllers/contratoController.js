const { Contrato, Sequencia, Estabelecimento, Fornecedor, Empresa } = require('../models');
const auditService = require('../services/auditService');

// Include padrao para contrato com fornecedor e estabelecimento->empresa
const contratoInclude = [
    { model: Fornecedor, as: 'fornecedor', attributes: ['id', 'nome'] },
    {
        model: Estabelecimento,
        as: 'estabelecimento',
        attributes: ['id', 'cod_estabel', 'nome'],
        include: [
            { model: Empresa, as: 'empresa', attributes: ['id', 'cod_empresa', 'nome'] }
        ]
    }
];

// Listar todos os contratos
exports.getAll = async (req, res) => {
    try {
        const where = {};
        if (req.query.fornecedor) {
            where.fornecedor_id = req.query.fornecedor;
        }
        const contratos = await Contrato.findAll({
            where,
            include: contratoInclude,
            order: [['nr_contrato', 'ASC']]
        });
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar contrato por ID
exports.getById = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: contratoInclude
        });
        if (!contrato) {
            return res.status(404).json({ message: 'Contrato nao encontrado' });
        }
        res.json(contrato);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo contrato
exports.create = async (req, res) => {
    try {
        // Verificar se o estabelecimento existe e buscar cod_estabel
        const estabelecimento = await Estabelecimento.findByPk(req.body.estabelecimento, {
            include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'cod_empresa', 'nome'] }]
        });
        if (!estabelecimento) {
            return res.status(400).json({ message: 'Estabelecimento nao encontrado' });
        }

        const contrato = await Contrato.create({
            fornecedor_id: req.body.fornecedor,
            nr_contrato: req.body.nr_contrato,
            estabelecimento_id: req.body.estabelecimento,
            cod_estabel: estabelecimento.cod_estabel,
            observacao: req.body.observacao || ''
        });

        const contratoPopulado = await Contrato.findByPk(contrato.id, {
            include: contratoInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'CONTRATO', 'Contrato', {
            recursoId: contrato.id,
            recursoNome: `Contrato ${contrato.nr_contrato}`,
            descricao: `Contrato criado: ${contrato.nr_contrato} - ${contratoPopulado.fornecedor?.nome} - ${estabelecimento.nome}`,
            dadosNovos: {
                nr_contrato: contrato.nr_contrato,
                cod_estabel: contrato.cod_estabel,
                estabelecimento: estabelecimento.nome,
                empresa: estabelecimento.empresa?.nome,
                fornecedor: contratoPopulado.fornecedor?.nome
            }
        });

        res.status(201).json(contratoPopulado);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar contrato
exports.update = async (req, res) => {
    try {
        // Buscar dados anteriores para auditoria
        const contratoAnterior = await Contrato.findByPk(req.params.id, {
            include: contratoInclude
        });
        if (!contratoAnterior) {
            return res.status(404).json({ message: 'Contrato nao encontrado' });
        }

        const updateData = {};
        if (req.body.fornecedor) updateData.fornecedor_id = req.body.fornecedor;
        if (req.body.nr_contrato) updateData.nr_contrato = req.body.nr_contrato;
        if (req.body.observacao !== undefined) updateData.observacao = req.body.observacao;

        // Se estiver mudando o estabelecimento, buscar e atualizar cod_estabel
        if (req.body.estabelecimento) {
            const estabelecimento = await Estabelecimento.findByPk(req.body.estabelecimento);
            if (!estabelecimento) {
                return res.status(400).json({ message: 'Estabelecimento nao encontrado' });
            }
            updateData.estabelecimento_id = req.body.estabelecimento;
            updateData.cod_estabel = estabelecimento.cod_estabel;
        }

        await Contrato.update(updateData, { where: { id: req.params.id } });

        const contrato = await Contrato.findByPk(req.params.id, {
            include: contratoInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'CONTRATO', 'Contrato', {
            recursoId: contrato.id,
            recursoNome: `Contrato ${contrato.nr_contrato}`,
            descricao: `Contrato atualizado: ${contrato.nr_contrato}`,
            dadosAnteriores: {
                nr_contrato: contratoAnterior.nr_contrato,
                cod_estabel: contratoAnterior.cod_estabel,
                estabelecimento: contratoAnterior.estabelecimento?.nome,
                empresa: contratoAnterior.estabelecimento?.empresa?.nome,
                observacao: contratoAnterior.observacao
            },
            dadosNovos: {
                nr_contrato: contrato.nr_contrato,
                cod_estabel: contrato.cod_estabel,
                estabelecimento: contrato.estabelecimento?.nome,
                empresa: contrato.estabelecimento?.empresa?.nome,
                observacao: contrato.observacao
            }
        });

        res.json(contrato);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir contrato (cascata)
exports.delete = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: contratoInclude
        });
        if (!contrato) {
            return res.status(404).json({ message: 'Contrato nao encontrado' });
        }

        // Contar sequencias para log
        const sequenciasCount = await Sequencia.count({ where: { contrato_id: req.params.id } });

        // Excluir sequencias do contrato
        await Sequencia.destroy({ where: { contrato_id: req.params.id } });

        // Excluir contrato
        await Contrato.destroy({ where: { id: req.params.id } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'CONTRATO', 'Contrato', {
            recursoId: req.params.id,
            recursoNome: `Contrato ${contrato.nr_contrato}`,
            descricao: `Contrato excluido em cascata: ${contrato.nr_contrato} - ${contrato.fornecedor?.nome} - ${contrato.estabelecimento?.nome}`,
            dadosAnteriores: {
                nr_contrato: contrato.nr_contrato,
                cod_estabel: contrato.cod_estabel,
                estabelecimento: contrato.estabelecimento?.nome,
                empresa: contrato.estabelecimento?.empresa?.nome,
                fornecedor: contrato.fornecedor?.nome
            },
            metadados: { sequenciasExcluidas: sequenciasCount },
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Contrato excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
