const { Fornecedor, Contrato, Sequencia } = require('../models');

// Listar todos os fornecedores
exports.getAll = async (req, res) => {
    try {
        const fornecedores = await Fornecedor.find().sort({ nome: 1 });
        res.json(fornecedores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar fornecedor por ID
exports.getById = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findById(req.params.id);
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
        const fornecedor = new Fornecedor({
            nome: req.body.nome
        });
        const novoFornecedor = await fornecedor.save();
        res.status(201).json(novoFornecedor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar fornecedor
exports.update = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findByIdAndUpdate(
            req.params.id,
            { nome: req.body.nome },
            { new: true, runValidators: true }
        );
        if (!fornecedor) {
            return res.status(404).json({ message: 'Fornecedor nao encontrado' });
        }
        res.json(fornecedor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir fornecedor (cascata)
exports.delete = async (req, res) => {
    try {
        const fornecedor = await Fornecedor.findById(req.params.id);
        if (!fornecedor) {
            return res.status(404).json({ message: 'Fornecedor nao encontrado' });
        }

        // Buscar contratos do fornecedor
        const contratos = await Contrato.find({ fornecedor: req.params.id });
        const contratoIds = contratos.map(c => c._id);

        // Excluir sequencias dos contratos
        await Sequencia.deleteMany({ contrato: { $in: contratoIds } });

        // Excluir contratos
        await Contrato.deleteMany({ fornecedor: req.params.id });

        // Excluir fornecedor
        await Fornecedor.findByIdAndDelete(req.params.id);

        res.json({ message: 'Fornecedor excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
