const { Sequencia, Contrato, Fornecedor } = require('../models');
const auditService = require('../services/auditService');

// Include padrao para sequencia com contrato e fornecedor
const sequenciaInclude = [
    {
        model: Contrato,
        as: 'contrato',
        include: [{ model: Fornecedor, as: 'fornecedor', attributes: ['id', 'nome'] }]
    }
];

// Listar todas as sequencias
exports.getAll = async (req, res) => {
    try {
        const where = {};
        if (req.query.contrato) {
            where.contrato_id = req.query.contrato;
        }
        const sequencias = await Sequencia.findAll({
            where,
            include: sequenciaInclude,
            order: [['num_seq_item', 'ASC']]
        });
        res.json(sequencias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar sequencia por ID
exports.getById = async (req, res) => {
    try {
        const sequencia = await Sequencia.findByPk(req.params.id, {
            include: sequenciaInclude
        });
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }
        res.json(sequencia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar sequencia por parametros (contrato, estabelecimento, sequencia)
exports.buscar = async (req, res) => {
    try {
        const { contrato: nrContrato, estabelecimento, sequencia } = req.query;

        // Validar parametros obrigatorios
        if (!nrContrato || !estabelecimento || !sequencia) {
            return res.status(400).json({
                message: 'Parametros obrigatorios: contrato, estabelecimento, sequencia',
                exemplo: '/api/sequencias/buscar?contrato=369&estabelecimento=1&sequencia=1'
            });
        }

        // Primeiro busca o contrato pelo numero e estabelecimento
        const contratoDoc = await Contrato.findOne({
            where: {
                nr_contrato: parseInt(nrContrato),
                cod_estabel: estabelecimento
            },
            include: [{ model: Fornecedor, as: 'fornecedor', attributes: ['id', 'nome'] }]
        });

        if (!contratoDoc) {
            return res.status(404).json({
                message: `Contrato ${nrContrato} estabelecimento ${estabelecimento} nao encontrado`
            });
        }

        // Busca a sequencia pelo numero e contrato
        const sequenciaDoc = await Sequencia.findOne({
            where: {
                contrato_id: contratoDoc.id,
                num_seq_item: parseInt(sequencia)
            },
            include: sequenciaInclude
        });

        if (!sequenciaDoc) {
            return res.status(404).json({
                message: `Sequencia ${sequencia} nao encontrada no contrato ${nrContrato}`
            });
        }

        res.json(sequenciaDoc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar nova sequencia
exports.create = async (req, res) => {
    try {
        const sequencia = await Sequencia.create({
            contrato_id: req.body.contrato,
            num_seq_item: req.body.num_seq_item,
            dia_emissao: req.body.dia_emissao,
            valor: req.body.valor,
            status_mensal: req.body.status_mensal || {}
        });

        const sequenciaPopulada = await Sequencia.findByPk(sequencia.id, {
            include: sequenciaInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: sequencia.id,
            recursoNome: `Seq ${sequencia.num_seq_item}`,
            descricao: `Sequencia criada: ${sequencia.num_seq_item} - Contrato ${sequenciaPopulada.contrato?.nr_contrato}`,
            dadosNovos: {
                num_seq_item: sequencia.num_seq_item,
                dia_emissao: sequencia.dia_emissao,
                valor: sequencia.valor,
                contrato: sequenciaPopulada.contrato?.nr_contrato
            }
        });

        res.status(201).json(sequenciaPopulada);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar sequencia
exports.update = async (req, res) => {
    try {
        // Buscar dados anteriores para auditoria
        const sequenciaAnterior = await Sequencia.findByPk(req.params.id);
        if (!sequenciaAnterior) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const updateData = {};
        if (req.body.contrato) updateData.contrato_id = req.body.contrato;
        if (req.body.num_seq_item !== undefined) updateData.num_seq_item = req.body.num_seq_item;
        if (req.body.dia_emissao !== undefined) updateData.dia_emissao = req.body.dia_emissao;
        if (req.body.valor !== undefined) updateData.valor = req.body.valor;
        if (req.body.status_mensal !== undefined) updateData.status_mensal = req.body.status_mensal;

        await Sequencia.update(updateData, { where: { id: req.params.id } });

        const sequencia = await Sequencia.findByPk(req.params.id, {
            include: sequenciaInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: sequencia.id,
            recursoNome: `Seq ${sequencia.num_seq_item}`,
            descricao: `Sequencia atualizada: ${sequencia.num_seq_item}`,
            dadosAnteriores: {
                num_seq_item: sequenciaAnterior.num_seq_item,
                dia_emissao: sequenciaAnterior.dia_emissao,
                valor: sequenciaAnterior.valor
            },
            dadosNovos: updateData
        });

        res.json(sequencia);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar status mensal especifico
exports.updateStatus = async (req, res) => {
    try {
        const { monthKey, status } = req.body;

        if (!monthKey || !status) {
            return res.status(400).json({ message: 'monthKey e status sao obrigatorios' });
        }

        const sequencia = await Sequencia.findByPk(req.params.id);
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const statusAnterior = sequencia.status_mensal?.[monthKey];
        sequencia.status_mensal = { ...sequencia.status_mensal, [monthKey]: status };
        sequencia.changed('status_mensal', true);
        await sequencia.save();

        const sequenciaAtualizada = await Sequencia.findByPk(req.params.id, {
            include: sequenciaInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: sequencia.id,
            recursoNome: `Seq ${sequencia.num_seq_item}`,
            descricao: `Status mensal atualizado: ${monthKey} - ${statusAnterior || 'vazio'} -> ${status}`,
            dadosAnteriores: { [monthKey]: statusAnterior },
            dadosNovos: { [monthKey]: status },
            metadados: { mes: monthKey }
        });

        res.json(sequenciaAtualizada);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir sequencia
exports.delete = async (req, res) => {
    try {
        // Buscar dados antes de excluir para auditoria
        const sequencia = await Sequencia.findByPk(req.params.id, {
            include: sequenciaInclude
        });
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        await Sequencia.destroy({ where: { id: req.params.id } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'SEQUENCIA', 'Sequencia', {
            recursoId: req.params.id,
            recursoNome: `Seq ${sequencia.num_seq_item}`,
            descricao: `Sequencia excluida: ${sequencia.num_seq_item} - Contrato ${sequencia.contrato?.nr_contrato}`,
            dadosAnteriores: {
                num_seq_item: sequencia.num_seq_item,
                dia_emissao: sequencia.dia_emissao,
                valor: sequencia.valor,
                contrato: sequencia.contrato?.nr_contrato
            },
            nivel: 'WARN'
        });

        res.json({ message: 'Sequencia excluida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
