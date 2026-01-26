const { Fornecedor, Contrato, Sequencia } = require('../models');

// Dados completos para tabela mensal
exports.getTabela = async (req, res) => {
    try {
        const sequencias = await Sequencia.find()
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

        const rows = sequencias
            .filter(seq => seq.contrato && seq.contrato.fornecedor)
            .map(seq => ({
                sequenciaId: seq._id,
                fornecedor: seq.contrato.fornecedor.nome,
                fornecedorId: seq.contrato.fornecedor._id,
                contrato: seq.contrato.numero,
                contratoId: seq.contrato._id,
                estabelecimento: seq.contrato.estabelecimento,
                sequencia: seq.numero,
                diaEmissao: seq.diaEmissao,
                custo: seq.custo,
                statusMensal: Object.fromEntries(seq.statusMensal || new Map()),
                observacao: seq.contrato.observacao
            }))
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
            Fornecedor.countDocuments(),
            Contrato.countDocuments(),
            Sequencia.find().populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            })
        ]);

        // Calcular pendentes e atrasadas do mes atual
        const hoje = new Date();
        const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

        let pendentes = 0;
        let atrasadas = 0;

        sequencias.forEach(seq => {
            if (!seq.contrato) return;

            const statusSalvo = seq.statusMensal?.get(mesAtual);

            if (statusSalvo === 'ok') return;

            const diaAtual = hoje.getDate();

            if (diaAtual < seq.diaEmissao) {
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
        await Sequencia.deleteMany({});
        await Contrato.deleteMany({});
        await Fornecedor.deleteMany({});

        // Criar fornecedores
        const fornecedores = await Fornecedor.insertMany([
            { nome: 'DI2S' },
            { nome: 'CABTEC' },
            { nome: 'CONTI CONSULTORIA' },
            { nome: 'VIVO' },
            { nome: 'BKP GARANTIDO' },
            { nome: 'SENIOR' }
        ]);

        const [di2s, cabtec, conti, vivo, bkp, senior] = fornecedores;

        // Criar contratos
        const contratos = await Contrato.insertMany([
            { fornecedor: di2s._id, numero: 310, estabelecimento: 1 },
            { fornecedor: cabtec._id, numero: 474, estabelecimento: 1 },
            { fornecedor: conti._id, numero: 684, estabelecimento: 2 },
            { fornecedor: vivo._id, numero: 236, estabelecimento: 1 },
            { fornecedor: bkp._id, numero: 593, estabelecimento: 2, observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: bkp._id, numero: 594, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: senior._id, numero: 545, estabelecimento: 2 },
            { fornecedor: senior._id, numero: 545, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' }
        ]);

        // Criar sequencias
        const sequenciasData = [
            // DI2S - Contrato 310
            { contrato: contratos[0]._id, numero: 1, diaEmissao: 15, custo: 3589.20 },
            { contrato: contratos[0]._id, numero: 2, diaEmissao: 15, custo: 708.15 },
            { contrato: contratos[0]._id, numero: 3, diaEmissao: 15, custo: 436.50 },
            { contrato: contratos[0]._id, numero: 4, diaEmissao: 15, custo: 261.16 },
            { contrato: contratos[0]._id, numero: 5, diaEmissao: 15, custo: 1343.64 },
            { contrato: contratos[0]._id, numero: 11, diaEmissao: 15, custo: 7091.50 },
            // CABTEC - Contrato 474
            { contrato: contratos[1]._id, numero: 12, diaEmissao: 15, custo: 214.50 },
            { contrato: contratos[1]._id, numero: 13, diaEmissao: 15, custo: 195.80 },
            { contrato: contratos[1]._id, numero: 14, diaEmissao: 15, custo: 78.40 },
            { contrato: contratos[1]._id, numero: 15, diaEmissao: 15, custo: 2827.50 },
            { contrato: contratos[1]._id, numero: 16, diaEmissao: 15, custo: 1007.73 },
            { contrato: contratos[1]._id, numero: 17, diaEmissao: 15, custo: 711.00 },
            { contrato: contratos[1]._id, numero: 18, diaEmissao: 15, custo: 4355.80 },
            // CONTI CONSULTORIA - Contrato 684
            { contrato: contratos[2]._id, numero: 3, diaEmissao: 3, custo: 6500.00 },
            { contrato: contratos[2]._id, numero: 2, diaEmissao: 3, custo: 2221.31 },
            // VIVO - Contrato 236
            { contrato: contratos[3]._id, numero: 1, diaEmissao: 18, custo: 6960.00 },
            // BKP GARANTIDO - Contratos 593 e 594
            { contrato: contratos[4]._id, numero: 1, diaEmissao: 1, custo: 1652.63 },
            { contrato: contratos[5]._id, numero: 1, diaEmissao: 1, custo: 1193.93 },
            // SENIOR - Contrato 545
            { contrato: contratos[6]._id, numero: 3, diaEmissao: 6, custo: 478.78 },
            { contrato: contratos[7]._id, numero: 2, diaEmissao: 1, custo: 5692.01 },
            { contrato: contratos[7]._id, numero: 2, diaEmissao: 29, custo: 2012.00 }
        ];

        await Sequencia.insertMany(sequenciasData);

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
