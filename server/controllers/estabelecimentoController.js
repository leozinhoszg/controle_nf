const { Estabelecimento, Empresa } = require('../models');
const auditService = require('../services/auditService');

// Include padrao para empresa
const empresaInclude = [
    { model: Empresa, as: 'empresa', attributes: ['id', 'cod_empresa', 'nome'] }
];

// Listar todos os estabelecimentos
exports.getAll = async (req, res) => {
    try {
        const { empresa } = req.query;
        const where = empresa ? { empresa_id: empresa } : {};

        const estabelecimentos = await Estabelecimento.findAll({
            where,
            order: [['nome', 'ASC']],
            include: empresaInclude
        });
        res.json(estabelecimentos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar estabelecimento por ID
exports.getById = async (req, res) => {
    try {
        const estabelecimento = await Estabelecimento.findByPk(req.params.id, {
            include: empresaInclude
        });
        if (!estabelecimento) {
            return res.status(404).json({ message: 'Estabelecimento nao encontrado' });
        }
        res.json(estabelecimento);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Criar novo estabelecimento
exports.create = async (req, res) => {
    try {
        // Verificar se a empresa existe
        const empresa = await Empresa.findByPk(req.body.empresa);
        if (!empresa) {
            return res.status(400).json({ message: 'Empresa nao encontrada' });
        }

        const novoEstabelecimento = await Estabelecimento.create({
            empresa_id: req.body.empresa,
            cod_estabel: req.body.cod_estabel,
            nome: req.body.nome,
            ativo: req.body.ativo !== undefined ? req.body.ativo : true
        });

        // Buscar com include para retornar dados completos
        const estabelecimentoCompleto = await Estabelecimento.findByPk(novoEstabelecimento.id, {
            include: empresaInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'CRIAR', 'ESTABELECIMENTO', 'Estabelecimento', {
            recursoId: novoEstabelecimento.id,
            recursoNome: novoEstabelecimento.nome,
            descricao: `Estabelecimento criado: ${novoEstabelecimento.nome} (${novoEstabelecimento.cod_estabel}) - Empresa: ${empresa.nome}`,
            dadosNovos: { cod_estabel: novoEstabelecimento.cod_estabel, nome: novoEstabelecimento.nome, empresa: empresa.nome }
        });

        res.status(201).json(estabelecimentoCompleto);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Atualizar estabelecimento
exports.update = async (req, res) => {
    try {
        const estabelecimentoAnterior = await Estabelecimento.findByPk(req.params.id, {
            include: empresaInclude
        });
        if (!estabelecimentoAnterior) {
            return res.status(404).json({ message: 'Estabelecimento nao encontrado' });
        }

        // Se estiver mudando a empresa, verificar se a nova empresa existe
        if (req.body.empresa && req.body.empresa !== String(estabelecimentoAnterior.empresa_id)) {
            const empresa = await Empresa.findByPk(req.body.empresa);
            if (!empresa) {
                return res.status(400).json({ message: 'Empresa nao encontrada' });
            }
        }

        await Estabelecimento.update(
            {
                empresa_id: req.body.empresa,
                cod_estabel: req.body.cod_estabel,
                nome: req.body.nome,
                ativo: req.body.ativo
            },
            { where: { id: req.params.id } }
        );

        const estabelecimento = await Estabelecimento.findByPk(req.params.id, {
            include: empresaInclude
        });

        // Log de auditoria
        await auditService.logCrud(req, 'ATUALIZAR', 'ESTABELECIMENTO', 'Estabelecimento', {
            recursoId: estabelecimento.id,
            recursoNome: estabelecimento.nome,
            descricao: `Estabelecimento atualizado: ${estabelecimento.nome}`,
            dadosAnteriores: {
                cod_estabel: estabelecimentoAnterior.cod_estabel,
                nome: estabelecimentoAnterior.nome,
                empresa: estabelecimentoAnterior.empresa?.nome,
                ativo: estabelecimentoAnterior.ativo
            },
            dadosNovos: {
                cod_estabel: estabelecimento.cod_estabel,
                nome: estabelecimento.nome,
                empresa: estabelecimento.empresa?.nome,
                ativo: estabelecimento.ativo
            }
        });

        res.json(estabelecimento);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Excluir estabelecimento
exports.delete = async (req, res) => {
    try {
        const estabelecimento = await Estabelecimento.findByPk(req.params.id, {
            include: empresaInclude
        });
        if (!estabelecimento) {
            return res.status(404).json({ message: 'Estabelecimento nao encontrado' });
        }

        await Estabelecimento.destroy({ where: { id: req.params.id } });

        // Log de auditoria
        await auditService.logCrud(req, 'EXCLUIR', 'ESTABELECIMENTO', 'Estabelecimento', {
            recursoId: req.params.id,
            recursoNome: estabelecimento.nome,
            descricao: `Estabelecimento excluido: ${estabelecimento.nome} - Empresa: ${estabelecimento.empresa?.nome}`,
            dadosAnteriores: { cod_estabel: estabelecimento.cod_estabel, nome: estabelecimento.nome, empresa: estabelecimento.empresa?.nome },
            nivel: 'WARN'
        });

        res.json({ message: 'Estabelecimento excluido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
