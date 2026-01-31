const { Sequencia } = require('../models');
const auditService = require('../services/auditService');

// Listar todas as sequencias
exports.getAll = async (req, res) => {
    try {
        const filter = {};
        if (req.query.contrato) {
            filter.contrato = req.query.contrato;
        }
        const sequencias = await Sequencia.find(filter)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            })
            .sort({ 'num-seq-item': 1 });
        res.json(sequencias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar sequencia por ID
exports.getById = async (req, res) => {
    try {
        const sequencia = await Sequencia.findById(req.params.id)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
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

        // Validar parâmetros obrigatórios
        if (!nrContrato || !estabelecimento || !sequencia) {
            return res.status(400).json({
                message: 'Parametros obrigatorios: contrato, estabelecimento, sequencia',
                exemplo: '/api/sequencias/buscar?contrato=369&estabelecimento=1&sequencia=1'
            });
        }

        // Primeiro busca o contrato pelo numero e estabelecimento
        const { Contrato } = require('../models');
        const contratoDoc = await Contrato.findOne({
            'nr-contrato': parseInt(nrContrato),
            'cod-estabel': estabelecimento
        }).populate('fornecedor', 'nome');

        if (!contratoDoc) {
            return res.status(404).json({
                message: `Contrato ${nrContrato} estabelecimento ${estabelecimento} nao encontrado`
            });
        }

        // Busca a sequencia pelo numero e contrato
        const sequenciaDoc = await Sequencia.findOne({
            contrato: contratoDoc._id,
            'num-seq-item': parseInt(sequencia)
        }).populate({
            path: 'contrato',
            populate: { path: 'fornecedor', select: 'nome' }
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
        const sequencia = new Sequencia({
            contrato: req.body.contrato,
            'num-seq-item': req.body['num-seq-item'],
            diaEmissao: req.body.diaEmissao,
            valor: req.body.valor,
            statusMensal: req.body.statusMensal || {}
        });
        const novaSequencia = await sequencia.save();
        const sequenciaPopulada = await Sequencia.findById(novaSequencia._id)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: novaSequencia._id,
            recursoNome: `Seq ${novaSequencia['num-seq-item']}`,
            descricao: `Sequencia criada: ${novaSequencia['num-seq-item']} - Contrato ${sequenciaPopulada.contrato?.['nr-contrato']}`,
            dadosNovos: {
                'num-seq-item': novaSequencia['num-seq-item'],
                diaEmissao: novaSequencia.diaEmissao,
                valor: novaSequencia.valor,
                contrato: sequenciaPopulada.contrato?.['nr-contrato']
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
        const sequenciaAnterior = await Sequencia.findById(req.params.id);
        if (!sequenciaAnterior) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const updateData = {};
        if (req.body.contrato) updateData.contrato = req.body.contrato;
        if (req.body['num-seq-item'] !== undefined) updateData['num-seq-item'] = req.body['num-seq-item'];
        if (req.body.diaEmissao !== undefined) updateData.diaEmissao = req.body.diaEmissao;
        if (req.body.valor !== undefined) updateData.valor = req.body.valor;
        if (req.body.statusMensal !== undefined) updateData.statusMensal = req.body.statusMensal;

        const sequencia = await Sequencia.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'contrato',
            populate: { path: 'fornecedor', select: 'nome' }
        });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: sequencia._id,
            recursoNome: `Seq ${sequencia['num-seq-item']}`,
            descricao: `Sequencia atualizada: ${sequencia['num-seq-item']}`,
            dadosAnteriores: {
                'num-seq-item': sequenciaAnterior['num-seq-item'],
                diaEmissao: sequenciaAnterior.diaEmissao,
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

        const sequencia = await Sequencia.findById(req.params.id);
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const statusAnterior = sequencia.statusMensal.get(monthKey);
        sequencia.statusMensal.set(monthKey, status);
        await sequencia.save();

        const sequenciaAtualizada = await Sequencia.findById(req.params.id)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'SEQUENCIA', 'Sequencia', {
            recursoId: sequencia._id,
            recursoNome: `Seq ${sequencia['num-seq-item']}`,
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
        const sequencia = await Sequencia.findById(req.params.id).populate({
            path: 'contrato',
            populate: { path: 'fornecedor', select: 'nome' }
        });
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        await Sequencia.findByIdAndDelete(req.params.id);

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'SEQUENCIA', 'Sequencia', {
            recursoId: req.params.id,
            recursoNome: `Seq ${sequencia['num-seq-item']}`,
            descricao: `Sequencia excluida: ${sequencia['num-seq-item']} - Contrato ${sequencia.contrato?.['nr-contrato']}`,
            dadosAnteriores: {
                'num-seq-item': sequencia['num-seq-item'],
                diaEmissao: sequencia.diaEmissao,
                valor: sequencia.valor,
                contrato: sequencia.contrato?.['nr-contrato']
            },
            nivel: 'WARN'
        });

        res.json({ message: 'Sequencia excluida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
