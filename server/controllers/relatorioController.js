const { Fornecedor, Contrato, Sequencia, Medicao } = require('../models');

// Dados completos para tabela mensal
exports.getTabela = async (req, res) => {
    try {
        const { ano } = req.query;
        const anoFiltro = ano ? parseInt(ano) : new Date().getFullYear();

        const sequencias = await Sequencia.find()
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor', select: 'nome' }
            });

        // Buscar medições do ano selecionado
        const inicioAno = new Date(anoFiltro, 0, 1);
        const fimAno = new Date(anoFiltro, 11, 31, 23, 59, 59);

        const medicoesPorSequencia = {};
        const medicoes = await Medicao.find({
            'dat-medicao': { $gte: inicioAno, $lte: fimAno }
        }).sort({ 'dat-medicao': -1 });

        medicoes.forEach(med => {
            const seqId = med.sequencia?.toString();
            if (seqId && !medicoesPorSequencia[seqId]) {
                medicoesPorSequencia[seqId] = {
                    datMedicao: med['dat-medicao'],
                    datPrevMedicao: med['dat-prev-medicao'],
                    numeroNota: med['numero-nota'],
                    valorMedicao: med['val-medicao'],
                    statusRegistro: med.statusRegistro,
                    responsavel: med['responsavel']
                };
            }
        });

        // Obter IDs das sequências que têm medições no ano selecionado
        const sequenciasComMedicao = new Set(Object.keys(medicoesPorSequencia));

        const rows = sequencias
            .filter(seq => {
                if (!seq.contrato || !seq.contrato.fornecedor) return false;

                // Verificar se tem medição no ano selecionado
                if (sequenciasComMedicao.has(seq._id.toString())) return true;

                // Verificar se tem statusMensal no ano selecionado
                if (seq.statusMensal) {
                    const statusMap = seq.statusMensal instanceof Map ? seq.statusMensal : new Map(Object.entries(seq.statusMensal));
                    for (const key of statusMap.keys()) {
                        if (key.startsWith(anoFiltro.toString())) return true;
                    }
                }

                return false;
            })
            .map(seq => {
                const medicaoRecente = medicoesPorSequencia[seq._id.toString()];
                return {
                    sequenciaId: seq._id,
                    fornecedor: seq.contrato.fornecedor.nome,
                    fornecedorId: seq.contrato.fornecedor._id,
                    contrato: seq.contrato['nr-contrato'] || seq.contrato.numero,
                    contratoId: seq.contrato._id,
                    estabelecimento: seq.contrato['cod-estabel'] || seq.contrato.estabelecimento || '01',
                    sequencia: seq['num-seq-item'] || seq.numero,
                    diaEmissao: seq.diaEmissao,
                    valor: seq.valor,
                    statusMensal: Object.fromEntries(seq.statusMensal || new Map()),
                    observacao: seq.contrato.observacao,
                    // Dados da medição mais recente
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
            { fornecedor: di2s._id, 'nr-contrato': 310, 'cod-estabel': '01' },
            { fornecedor: cabtec._id, 'nr-contrato': 474, 'cod-estabel': '01' },
            { fornecedor: conti._id, 'nr-contrato': 684, 'cod-estabel': '02' },
            { fornecedor: vivo._id, 'nr-contrato': 236, 'cod-estabel': '01' },
            { fornecedor: bkp._id, 'nr-contrato': 593, 'cod-estabel': '02', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: bkp._id, 'nr-contrato': 594, 'cod-estabel': '01', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: senior._id, 'nr-contrato': 545, 'cod-estabel': '02' },
            { fornecedor: senior._id, 'nr-contrato': 545, 'cod-estabel': '01', observacao: 'Necessario atualizacao de contrato' }
        ]);

        // Criar sequencias
        const sequenciasData = [
            // DI2S - Contrato 310
            { contrato: contratos[0]._id, 'num-seq-item': 1, diaEmissao: 15, valor: 3589.20 },
            { contrato: contratos[0]._id, 'num-seq-item': 2, diaEmissao: 15, valor: 708.15 },
            { contrato: contratos[0]._id, 'num-seq-item': 3, diaEmissao: 15, valor: 436.50 },
            { contrato: contratos[0]._id, 'num-seq-item': 4, diaEmissao: 15, valor: 261.16 },
            { contrato: contratos[0]._id, 'num-seq-item': 5, diaEmissao: 15, valor: 1343.64 },
            { contrato: contratos[0]._id, 'num-seq-item': 11, diaEmissao: 15, valor: 7091.50 },
            // CABTEC - Contrato 474
            { contrato: contratos[1]._id, 'num-seq-item': 12, diaEmissao: 15, valor: 214.50 },
            { contrato: contratos[1]._id, 'num-seq-item': 13, diaEmissao: 15, valor: 195.80 },
            { contrato: contratos[1]._id, 'num-seq-item': 14, diaEmissao: 15, valor: 78.40 },
            { contrato: contratos[1]._id, 'num-seq-item': 15, diaEmissao: 15, valor: 2827.50 },
            { contrato: contratos[1]._id, 'num-seq-item': 16, diaEmissao: 15, valor: 1007.73 },
            { contrato: contratos[1]._id, 'num-seq-item': 17, diaEmissao: 15, valor: 711.00 },
            { contrato: contratos[1]._id, 'num-seq-item': 18, diaEmissao: 15, valor: 4355.80 },
            // CONTI CONSULTORIA - Contrato 684
            { contrato: contratos[2]._id, 'num-seq-item': 3, diaEmissao: 3, valor: 6500.00 },
            { contrato: contratos[2]._id, 'num-seq-item': 2, diaEmissao: 3, valor: 2221.31 },
            // VIVO - Contrato 236
            { contrato: contratos[3]._id, 'num-seq-item': 1, diaEmissao: 18, valor: 6960.00 },
            // BKP GARANTIDO - Contratos 593 e 594
            { contrato: contratos[4]._id, 'num-seq-item': 1, diaEmissao: 1, valor: 1652.63 },
            { contrato: contratos[5]._id, 'num-seq-item': 1, diaEmissao: 1, valor: 1193.93 },
            // SENIOR - Contrato 545
            { contrato: contratos[6]._id, 'num-seq-item': 3, diaEmissao: 6, valor: 478.78 },
            { contrato: contratos[7]._id, 'num-seq-item': 2, diaEmissao: 1, valor: 5692.01 },
            { contrato: contratos[7]._id, 'num-seq-item': 2, diaEmissao: 29, valor: 2012.00 }
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
