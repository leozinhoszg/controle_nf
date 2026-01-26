const { Contrato, Sequencia } = require('../models');

// Listar todos os contratos
exports.getAll = async (req, res) => {
    try {
        const filter = {};
        if (req.query.fornecedor) {
            filter.fornecedor = req.query.fornecedor;
        }
        const contratos = await Contrato.find(filter)
            .populate('fornecedor', 'nome')
            .sort({ numero: 1 });
        res.json(contratos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar contrato por ID
exports.getById = async (req, res) => {
    try {
        const contrato = await Contrato.findById(req.params.id)
            .populate('fornecedor', 'nome');
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
        const contrato = new Contrato({
            fornecedor: req.body.fornecedor,
            numero: req.body.numero,
            estabelecimento: req.body.estabelecimento || 1,
            observacao: req.body.observacao || ''
        });
        const novoContrato = await contrato.save();
        const contratoPopulado = await Contrato.findById(novoContrato._id)
            .populate('fornecedor', 'nome');
        res.status(201).json(contratoPopulado);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar contrato
exports.update = async (req, res) => {
    try {
        const updateData = {};
        if (req.body.fornecedor) updateData.fornecedor = req.body.fornecedor;
        if (req.body.numero) updateData.numero = req.body.numero;
        if (req.body.estabelecimento !== undefined) updateData.estabelecimento = req.body.estabelecimento;
        if (req.body.observacao !== undefined) updateData.observacao = req.body.observacao;

        const contrato = await Contrato.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('fornecedor', 'nome');

        if (!contrato) {
            return res.status(404).json({ message: 'Contrato nao encontrado' });
        }
        res.json(contrato);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir contrato (cascata)
exports.delete = async (req, res) => {
    try {
        const contrato = await Contrato.findById(req.params.id);
        if (!contrato) {
            return res.status(404).json({ message: 'Contrato nao encontrado' });
        }

        // Excluir sequencias do contrato
        await Sequencia.deleteMany({ contrato: req.params.id });

        // Excluir contrato
        await Contrato.findByIdAndDelete(req.params.id);

        res.json({ message: 'Contrato excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
