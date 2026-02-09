const { Op } = require('sequelize');
const { Fornecedor, Contrato, Sequencia, Medicao, Estabelecimento, Empresa } = require('../models');

// Include completo para sequencia com contrato, fornecedor e estabelecimento
const sequenciaFullInclude = [
    {
        model: Contrato,
        as: 'contrato',
        include: [
            { model: Fornecedor, as: 'fornecedor', attributes: ['id', 'nome'] },
            {
                model: Estabelecimento,
                as: 'estabelecimento',
                attributes: ['id', 'cod_estabel', 'nome'],
                include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'cod_empresa', 'nome'] }]
            }
        ]
    }
];

// Dados completos para tabela mensal
exports.getTabela = async (req, res) => {
    try {
        const { ano } = req.query;
        const anoFiltro = ano ? parseInt(ano) : new Date().getFullYear();

        const sequencias = await Sequencia.findAll({
            include: sequenciaFullInclude
        });

        // Buscar medicoes do ano selecionado
        const inicioAno = new Date(anoFiltro, 0, 1);
        const fimAno = new Date(anoFiltro, 11, 31, 23, 59, 59);

        const medicoesPorSequencia = {};
        const medicoes = await Medicao.findAll({
            where: {
                dat_medicao: { [Op.gte]: inicioAno, [Op.lte]: fimAno }
            },
            order: [['dat_medicao', 'DESC']]
        });

        medicoes.forEach(med => {
            const seqId = med.sequencia_id?.toString();
            if (seqId && !medicoesPorSequencia[seqId]) {
                medicoesPorSequencia[seqId] = {
                    datMedicao: med.dat_medicao,
                    datPrevMedicao: med.dat_prev_medicao,
                    numeroNota: med.numero_nota,
                    valorMedicao: med.val_medicao,
                    statusRegistro: med.status_registro,
                    responsavel: med.responsavel
                };
            }
        });

        const rows = sequencias
            .filter(seq => {
                // Filtrar apenas sequencias com contrato e fornecedor validos
                if (!seq.contrato || !seq.contrato.fornecedor) return false;
                return true;
            })
            .map(seq => {
                const medicaoRecente = medicoesPorSequencia[seq.id.toString()];
                const estab = seq.contrato.estabelecimento;
                return {
                    sequenciaId: seq.id,
                    fornecedor: seq.contrato.fornecedor.nome,
                    fornecedorId: seq.contrato.fornecedor.id,
                    contrato: seq.contrato.nr_contrato,
                    contratoId: seq.contrato.id,
                    codEstabel: seq.contrato.cod_estabel || estab?.cod_estabel || '01',
                    estabelecimento: estab?.cod_estabel || seq.contrato.cod_estabel || '01',
                    estabelecimentoNome: estab?.nome || null,
                    empresa: estab?.empresa?.nome || null,
                    sequencia: seq.num_seq_item,
                    diaEmissao: seq.dia_emissao,
                    valor: seq.valor,
                    statusMensal: seq.status_mensal || {},
                    observacao: seq.contrato.observacao,
                    // Dados da medicao mais recente
                    datMedicao: medicaoRecente?.datMedicao || null,
                    datPrevMedicao: medicaoRecente?.datPrevMedicao || null,
                    numeroNota: medicaoRecente?.numeroNota || null,
                    valorMedicao: medicaoRecente?.valorMedicao || null,
                    statusRegistro: medicaoRecente?.statusRegistro || null,
                    responsavel: medicaoRecente?.responsavel || null
                };
            })
            .sort((a, b) => {
                if (a.fornecedor !== b.fornecedor) return a.fornecedor.localeCompare(b.fornecedor);
                if (a.contrato !== b.contrato) return a.contrato - b.contrato;
                return a.sequencia - b.sequencia;
            });

        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Resumo para dashboard
exports.getResumo = async (req, res) => {
    try {
        const [fornecedores, contratos, sequencias] = await Promise.all([
            Fornecedor.count(),
            Contrato.count(),
            Sequencia.findAll({
                include: sequenciaFullInclude
            })
        ]);

        // Calcular pendentes e atrasadas do mes atual
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

        let pendentes = 0;
        let atrasadas = 0;

        sequencias.forEach(seq => {
            if (!seq.contrato) return;

            const statusSalvo = seq.status_mensal?.[mesAtual];

            if (statusSalvo === 'ok') return;

            const diaAtual = hoje.getDate();

            if (diaAtual < seq.dia_emissao) {
                pendentes++;
            } else if (!statusSalvo || statusSalvo !== 'ok') {
                atrasadas++;
            }
        });

        res.json({
            fornecedores,
            contratos,
            sequencias: sequencias.length,
            pendentes,
            atrasadas
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Carregar dados de exemplo
exports.seed = async (req, res) => {
    try {
        // Limpar dados existentes
        await Sequencia.destroy({ where: {} });
        await Contrato.destroy({ where: {} });
        await Fornecedor.destroy({ where: {} });

        // Criar fornecedores
        const fornecedores = await Fornecedor.bulkCreate([
            { nome: 'DI2S' },
            { nome: 'CABTEC' },
            { nome: 'CONTI CONSULTORIA' },
            { nome: 'VIVO' },
            { nome: 'BKP GARANTIDO' },
            { nome: 'SENIOR' }
        ]);

        const [di2s, cabtec, conti, vivo, bkp, senior] = fornecedores;

        // Criar contratos
        const contratos = await Contrato.bulkCreate([
            { fornecedor_id: di2s.id, nr_contrato: 310, cod_estabel: '01' },
            { fornecedor_id: cabtec.id, nr_contrato: 474, cod_estabel: '01' },
            { fornecedor_id: conti.id, nr_contrato: 684, cod_estabel: '02' },
            { fornecedor_id: vivo.id, nr_contrato: 236, cod_estabel: '01' },
            { fornecedor_id: bkp.id, nr_contrato: 593, cod_estabel: '02', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor_id: bkp.id, nr_contrato: 594, cod_estabel: '01', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor_id: senior.id, nr_contrato: 545, cod_estabel: '02' },
            { fornecedor_id: senior.id, nr_contrato: 545, cod_estabel: '01', observacao: 'Necessario atualizacao de contrato' }
        ]);

        // Criar sequencias
        const sequenciasData = [
            // DI2S - Contrato 310
            { contrato_id: contratos[0].id, num_seq_item: 1, dia_emissao: 15, valor: 3589.20 },
            { contrato_id: contratos[0].id, num_seq_item: 2, dia_emissao: 15, valor: 708.15 },
            { contrato_id: contratos[0].id, num_seq_item: 3, dia_emissao: 15, valor: 436.50 },
            { contrato_id: contratos[0].id, num_seq_item: 4, dia_emissao: 15, valor: 261.16 },
            { contrato_id: contratos[0].id, num_seq_item: 5, dia_emissao: 15, valor: 1343.64 },
            { contrato_id: contratos[0].id, num_seq_item: 11, dia_emissao: 15, valor: 7091.50 },
            // CABTEC - Contrato 474
            { contrato_id: contratos[1].id, num_seq_item: 12, dia_emissao: 15, valor: 214.50 },
            { contrato_id: contratos[1].id, num_seq_item: 13, dia_emissao: 15, valor: 195.80 },
            { contrato_id: contratos[1].id, num_seq_item: 14, dia_emissao: 15, valor: 78.40 },
            { contrato_id: contratos[1].id, num_seq_item: 15, dia_emissao: 15, valor: 2827.50 },
            { contrato_id: contratos[1].id, num_seq_item: 16, dia_emissao: 15, valor: 1007.73 },
            { contrato_id: contratos[1].id, num_seq_item: 17, dia_emissao: 15, valor: 711.00 },
            { contrato_id: contratos[1].id, num_seq_item: 18, dia_emissao: 15, valor: 4355.80 },
            // CONTI CONSULTORIA - Contrato 684
            { contrato_id: contratos[2].id, num_seq_item: 3, dia_emissao: 3, valor: 6500.00 },
            { contrato_id: contratos[2].id, num_seq_item: 2, dia_emissao: 3, valor: 2221.31 },
            // VIVO - Contrato 236
            { contrato_id: contratos[3].id, num_seq_item: 1, dia_emissao: 18, valor: 6960.00 },
            // BKP GARANTIDO - Contratos 593 e 594
            { contrato_id: contratos[4].id, num_seq_item: 1, dia_emissao: 1, valor: 1652.63 },
            { contrato_id: contratos[5].id, num_seq_item: 1, dia_emissao: 1, valor: 1193.93 },
            // SENIOR - Contrato 545
            { contrato_id: contratos[6].id, num_seq_item: 3, dia_emissao: 6, valor: 478.78 },
            { contrato_id: contratos[7].id, num_seq_item: 2, dia_emissao: 1, valor: 5692.01 },
            { contrato_id: contratos[7].id, num_seq_item: 2, dia_emissao: 29, valor: 2012.00 }
        ];

        await Sequencia.bulkCreate(sequenciasData);

        res.json({
            message: 'Dados de exemplo carregados com sucesso',
            fornecedores: fornecedores.length,
            contratos: contratos.length,
            sequencias: sequenciasData.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
