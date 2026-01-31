const { Medicao, Sequencia, Contrato } = require('../models');
const medicaoService = require('../services/medicaoService');
const auditService = require('../services/auditService');

// Listar medições de uma sequência
exports.getBySequencia = async (req, res) => {
    try {
        const { sequenciaId } = req.params;
        const medicoes = await medicaoService.buscarMedicoesLocais(sequenciaId);
        res.json(medicoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar medições por parâmetros (contrato, estabelecimento, sequência)
exports.buscar = async (req, res) => {
    try {
        const { contrato, estabelecimento, sequencia } = req.query;

        if (!contrato || !estabelecimento || !sequencia) {
            return res.status(400).json({
                message: 'Parâmetros obrigatórios: contrato, estabelecimento, sequencia',
                exemplo: '/api/medicoes/buscar?contrato=369&estabelecimento=01&sequencia=1'
            });
        }

        // Primeiro tenta buscar do banco local
        let medicoes = await medicaoService.buscarMedicoesPorContrato(
            parseInt(contrato),
            estabelecimento,
            parseInt(sequencia)
        );

        // Se não houver dados locais, busca da API e sincroniza
        if (medicoes.length === 0) {
            // Buscar a sequência correspondente
            const contratoDoc = await Contrato.findOne({
                'nr-contrato': parseInt(contrato),
                'cod-estabel': estabelecimento
            });

            if (contratoDoc) {
                const sequenciaDoc = await Sequencia.findOne({
                    contrato: contratoDoc._id,
                    'num-seq-item': parseInt(sequencia)
                }).populate({
                    path: 'contrato',
                    populate: { path: 'fornecedor' }
                });

                if (sequenciaDoc) {
                    try {
                        medicoes = await medicaoService.sincronizarMedicoes(sequenciaDoc);
                        await medicaoService.atualizarStatusMensal(sequenciaDoc._id);
                    } catch (syncError) {
                        console.error('Erro ao sincronizar:', syncError.message);
                    }
                }
            }
        }

        res.json({
            total: medicoes.length,
            origem: medicoes.length > 0 ? 'local' : 'vazio',
            medicoes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sincronizar medições de uma sequência específica com a API do ERP
exports.sincronizar = async (req, res) => {
    try {
        const { sequenciaId } = req.params;

        const sequencia = await Sequencia.findById(sequenciaId)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor' }
            });

        if (!sequencia) {
            return res.status(404).json({ message: 'Sequência não encontrada' });
        }

        const medicoes = await medicaoService.sincronizarMedicoes(sequencia);
        await medicaoService.atualizarStatusMensal(sequenciaId);

        // Log de auditoria
        await auditService.logCrud(req, 'SINCRONIZAR', 'MEDICAO', 'Medicao', {
            recursoId: sequenciaId,
            recursoNome: `Seq ${sequencia['num-seq-item']}`,
            descricao: `Medicoes sincronizadas: Contrato ${sequencia.contrato?.['nr-contrato']} Seq ${sequencia['num-seq-item']}`,
            metadados: {
                contrato: sequencia.contrato?.['nr-contrato'],
                estabelecimento: sequencia.contrato?.['cod-estabel'],
                medicoesProcessadas: medicoes.length
            }
        });

        res.json({
            message: 'Sincronização concluída',
            sequencia: {
                id: sequencia._id,
                contrato: sequencia.contrato?.['nr-contrato'],
                estabelecimento: sequencia.contrato?.['cod-estabel'],
                numSeqItem: sequencia['num-seq-item']
            },
            medicoesProcessadas: medicoes.length,
            medicoes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sincronizar todas as sequências
exports.sincronizarTodas = async (req, res) => {
    try {
        const resultados = await medicaoService.sincronizarTodas();

        const sucessos = resultados.filter(r => r.sucesso).length;
        const erros = resultados.filter(r => !r.sucesso).length;

        // Log de auditoria
        await auditService.logCrud(req, 'SINCRONIZAR_LOTE', 'MEDICAO', 'Medicao', {
            descricao: `Sincronizacao em lote: ${sucessos} sucessos, ${erros} erros`,
            metadados: {
                total: resultados.length,
                sucessos,
                erros
            },
            nivel: erros > 0 ? 'WARN' : 'INFO'
        });

        res.json({
            message: 'Sincronização em lote concluída',
            total: resultados.length,
            sucessos,
            erros,
            detalhes: resultados
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar status consolidado de uma sequência
exports.getStatusConsolidado = async (req, res) => {
    try {
        const { sequenciaId } = req.params;

        const sequencia = await Sequencia.findById(sequenciaId)
            .populate({
                path: 'contrato',
                populate: { path: 'fornecedor' }
            });

        if (!sequencia) {
            return res.status(404).json({ message: 'Sequência não encontrada' });
        }

        const medicoes = await medicaoService.buscarMedicoesLocais(sequenciaId);

        // Agrupar por mês
        const medicoesPerMonth = {};
        medicoes.forEach(med => {
            const mes = med.mesReferencia;
            if (!medicoesPerMonth[mes]) {
                medicoesPerMonth[mes] = [];
            }
            medicoesPerMonth[mes].push({
                numSeqMedicao: med['num-seq-medicao'],
                valor: med['val-medicao'],
                dataMedicao: med['dat-medicao'],
                dataRecebimento: med['dat-receb'],
                dataEmissao: med['dat-prev-medicao'],
                numeroNota: med['numero-nota'],
                statusRegistro: med.statusRegistro,
                alertaValor: med.alertaValor,
                diferencaValor: med.diferencaValor
            });
        });

        res.json({
            sequencia: {
                id: sequencia._id,
                fornecedor: sequencia.contrato?.fornecedor?.nome,
                contrato: sequencia.contrato?.['nr-contrato'],
                estabelecimento: sequencia.contrato?.['cod-estabel'],
                numSeqItem: sequencia['num-seq-item'],
                diaEmissao: sequencia.diaEmissao,
                valorEsperado: sequencia.valor
            },
            statusMensal: Object.fromEntries(sequencia.statusMensal || new Map()),
            medicoesPerMonth
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verificar alertas de valor
exports.getAlertas = async (req, res) => {
    try {
        const alertas = await Medicao.find({ alertaValor: true })
            .populate({
                path: 'sequencia',
                populate: {
                    path: 'contrato',
                    populate: { path: 'fornecedor' }
                }
            })
            .sort({ createdAt: -1 });

        res.json(alertas.map(med => ({
            medicaoId: med._id,
            sequencia: med.sequencia?.['num-seq-item'],
            contrato: med.sequencia?.contrato?.['nr-contrato'],
            fornecedor: med.sequencia?.contrato?.fornecedor?.nome,
            mesReferencia: med.mesReferencia,
            valorEsperado: med.sequencia?.valor,
            valorMedicao: med['val-medicao'],
            diferenca: med.diferencaValor,
            numeroNota: med['numero-nota'],
            dataMedicao: med['dat-medicao']
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
