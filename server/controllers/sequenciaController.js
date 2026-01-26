const { Sequencia } = require('../models');

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
            .sort({ numero: 1 });
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

// Criar nova sequencia
exports.create = async (req, res) => {
    try {
        const sequencia = new Sequencia({
            contrato: req.body.contrato,
            numero: req.body.numero,
            diaEmissao: req.body.diaEmissao,
            custo: req.body.custo,
            statusMensal: req.body.statusMensal || {}
        });
        const novaSequencia = await sequencia.save();
        const sequenciaPopulada = await Sequencia.findById(novaSequencia._id)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });
        res.status(201).json(sequenciaPopulada);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar sequencia
exports.update = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.contrato) updateData.contrato = req.body.contrato;
        if (req.body.numero !== undefined) updateData.numero = req.body.numero;
        if (req.body.diaEmissao !== undefined) updateData.diaEmissao = req.body.diaEmissao;
        if (req.body.custo !== undefined) updateData.custo = req.body.custo;
        if (req.body.statusMensal !== undefined) updateData.statusMensal = req.body.statusMensal;

        const sequencia = await Sequencia.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate({
            path: 'contrato',
            populate: { path: 'fornecedor', select: 'nome' }
        });

        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }
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

        sequencia.statusMensal.set(monthKey, status);
        await sequencia.save();

        const sequenciaAtualizada = await Sequencia.findById(req.params.id)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

        res.json(sequenciaAtualizada);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir sequencia
exports.delete = async (req, res) => {
    try {
        const sequencia = await Sequencia.findByIdAndDelete(req.params.id);
        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }
        res.json({ message: 'Sequencia excluida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
