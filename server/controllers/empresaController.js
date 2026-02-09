const { Empresa, Estabelecimento } = require('../models');
const auditService = require('../services/auditService');

// Listar todas as empresas
exports.getAll = async (req, res) => {
    try {
        const empresas = await Empresa.findAll({
            order: [['nome', 'ASC']],
            include: [{ model: Estabelecimento, as: 'estabelecimentos' }]
        });
        res.json(empresas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar empresa por ID
exports.getById = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: [{ model: Estabelecimento, as: 'estabelecimentos' }]
        });
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa nao encontrada' });
        }
        res.json(empresa);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar nova empresa
exports.create = async (req, res) => {
    try {
        const novaEmpresa = await Empresa.create({
            cod_empresa: req.body.cod_empresa,
            nome: req.body.nome,
            ativo: req.body.ativo !== undefined ? req.body.ativo : true
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'EMPRESA', 'Empresa', {
            recursoId: novaEmpresa.id,
            recursoNome: novaEmpresa.nome,
            descricao: `Empresa criada: ${novaEmpresa.nome} (${novaEmpresa.cod_empresa})`,
            dadosNovos: { cod_empresa: novaEmpresa.cod_empresa, nome: novaEmpresa.nome }
        });

        res.status(201).json(novaEmpresa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar empresa
exports.update = async (req, res) => {
    try {
        const empresaAnterior = await Empresa.findByPk(req.params.id);
        if (!empresaAnterior) {
            return res.status(404).json({ message: 'Empresa nao encontrada' });
        }

        await Empresa.update(
            {
                cod_empresa: req.body.cod_empresa,
                nome: req.body.nome,
                ativo: req.body.ativo
            },
            { where: { id: req.params.id } }
        );

        const empresa = await Empresa.findByPk(req.params.id);

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'EMPRESA', 'Empresa', {
            recursoId: empresa.id,
            recursoNome: empresa.nome,
            descricao: `Empresa atualizada: ${empresa.nome}`,
            dadosAnteriores: { cod_empresa: empresaAnterior.cod_empresa, nome: empresaAnterior.nome, ativo: empresaAnterior.ativo },
            dadosNovos: { cod_empresa: empresa.cod_empresa, nome: empresa.nome, ativo: empresa.ativo }
        });

        res.json(empresa);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir empresa (cascata)
exports.delete = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);
        if (!empresa) {
            return res.status(404).json({ message: 'Empresa nao encontrada' });
        }

        // Contar estabelecimentos que serao excluidos
        const estabelecimentos = await Estabelecimento.findAll({ where: { empresa_id: req.params.id } });

        // Excluir estabelecimentos
        await Estabelecimento.destroy({ where: { empresa_id: req.params.id } });

        // Excluir empresa
        await Empresa.destroy({ where: { id: req.params.id } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'EMPRESA', 'Empresa', {
            recursoId: req.params.id,
            recursoNome: empresa.nome,
            descricao: `Empresa excluida em cascata: ${empresa.nome}`,
            dadosAnteriores: { cod_empresa: empresa.cod_empresa, nome: empresa.nome },
            metadados: {
                estabelecimentosExcluidos: estabelecimentos.length
            },
            nivel: 'CRITICAL'
        });

        res.json({ message: 'Empresa excluida com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
