const { Op } = require('sequelize');
const { Medicao, Sequencia, Contrato, Fornecedor } = require('../models');
const medicaoService = require('../services/medicaoService');
const auditService = require('../services/auditService');

// Include para sequencia com contrato e fornecedor
const sequenciaFullInclude = [
    {
        model: Contrato,
        as: 'contrato',
        include: [{ model: Fornecedor, as: 'fornecedor' }]
    }
];

// Listar medicoes de uma sequencia
exports.getBySequencia = async (req, res) => {
    try {
        const { sequenciaId } = req.params;
        const medicoes = await medicaoService.buscarMedicoesLocais(sequenciaId);
        res.json(medicoes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar medicoes por parametros (contrato, estabelecimento, sequencia)
exports.buscar = async (req, res) => {
    try {
        const { contrato, estabelecimento, sequencia } = req.query;

        if (!contrato || !estabelecimento || !sequencia) {
            return res.status(400).json({
                message: 'Parametros obrigatorios: contrato, estabelecimento, sequencia',
                exemplo: '/api/medicoes/buscar?contrato=369&estabelecimento=01&sequencia=1'
            });
        }

        // Primeiro tenta buscar do banco local
        let medicoes = await medicaoService.buscarMedicoesPorContrato(
            parseInt(contrato),
            estabelecimento,
            parseInt(sequencia)
        );

        // Se nao houver dados locais, busca da API e sincroniza
        if (medicoes.length === 0) {
            // Buscar a sequencia correspondente
            const contratoDoc = await Contrato.findOne({
                where: {
                    nr_contrato: parseInt(contrato),
                    cod_estabel: estabelecimento
                }
            });

            if (contratoDoc) {
                const sequenciaDoc = await Sequencia.findOne({
                    where: {
                        contrato_id: contratoDoc.id,
                        num_seq_item: parseInt(sequencia)
                    },
                    include: sequenciaFullInclude
                });

                if (sequenciaDoc) {
                    try {
                        medicoes = await medicaoService.sincronizarMedicoes(sequenciaDoc);
                        await medicaoService.atualizarStatusMensal(sequenciaDoc.id);
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

// Sincronizar medicoes de uma sequencia especifica com a API do ERP
exports.sincronizar = async (req, res) => {
    try {
        const { sequenciaId } = req.params;

        const sequencia = await Sequencia.findByPk(sequenciaId, {
            include: sequenciaFullInclude
        });

        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const medicoes = await medicaoService.sincronizarMedicoes(sequencia);
        await medicaoService.atualizarStatusMensal(sequenciaId);

        // Log de auditoria
        await auditService.logCrud(req, 'SINCRONIZAR', 'MEDICAO', 'Medicao', {
            recursoId: sequenciaId,
            recursoNome: `Seq ${sequencia.num_seq_item}`,
            descricao: `Medicoes sincronizadas: Contrato ${sequencia.contrato?.nr_contrato} Seq ${sequencia.num_seq_item}`,
            metadados: {
                contrato: sequencia.contrato?.nr_contrato,
                estabelecimento: sequencia.contrato?.cod_estabel,
                medicoesProcessadas: medicoes.length
            }
        });

        res.json({
            message: 'Sincronizacao concluida',
            sequencia: {
                id: sequencia.id,
                contrato: sequencia.contrato?.nr_contrato,
                estabelecimento: sequencia.contrato?.cod_estabel,
                numSeqItem: sequencia.num_seq_item
            },
            medicoesProcessadas: medicoes.length,
            medicoes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sincronizar todas as sequencias
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
            message: 'Sincronizacao em lote concluida',
            total: resultados.length,
            sucessos,
            erros,
            detalhes: resultados
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Buscar status consolidado de uma sequencia
exports.getStatusConsolidado = async (req, res) => {
    try {
        const { sequenciaId } = req.params;

        const sequencia = await Sequencia.findByPk(sequenciaId, {
            include: sequenciaFullInclude
        });

        if (!sequencia) {
            return res.status(404).json({ message: 'Sequencia nao encontrada' });
        }

        const medicoes = await medicaoService.buscarMedicoesLocais(sequenciaId);

        // Agrupar por mes
        const medicoesPerMonth = {};
        medicoes.forEach(med => {
            const mes = med.mes_referencia;
            if (!medicoesPerMonth[mes]) {
                medicoesPerMonth[mes] = [];
            }
            medicoesPerMonth[mes].push({
                numSeqMedicao: med.num_seq_medicao,
                valor: med.val_medicao,
                dataMedicao: med.dat_medicao,
                dataRecebimento: med.dat_receb,
                dataEmissao: med.dat_prev_medicao,
                numeroNota: med.numero_nota,
                statusRegistro: med.status_registro,
                alertaValor: med.alerta_valor,
                diferencaValor: med.diferenca_valor
            });
        });

        res.json({
            sequencia: {
                id: sequencia.id,
                fornecedor: sequencia.contrato?.fornecedor?.nome,
                contrato: sequencia.contrato?.nr_contrato,
                estabelecimento: sequencia.contrato?.cod_estabel,
                numSeqItem: sequencia.num_seq_item,
                diaEmissao: sequencia.dia_emissao,
                valorEsperado: sequencia.valor
            },
            statusMensal: sequencia.status_mensal || {},
            medicoesPerMonth
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verificar alertas de valor
exports.getAlertas = async (req, res) => {
    try {
        const alertas = await Medicao.findAll({
            where: { alerta_valor: true },
            include: [
                {
                    model: Sequencia,
                    as: 'sequencia',
                    include: [
                        {
                            model: Contrato,
                            as: 'contrato',
                            include: [{ model: Fornecedor, as: 'fornecedor' }]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(alertas.map(med => ({
            medicaoId: med.id,
            sequencia: med.sequencia?.num_seq_item,
            contrato: med.sequencia?.contrato?.nr_contrato,
            fornecedor: med.sequencia?.contrato?.fornecedor?.nome,
            mesReferencia: med.mes_referencia,
            valorEsperado: med.sequencia?.valor,
            valorMedicao: med.val_medicao,
            diferenca: med.diferenca_valor,
            numeroNota: med.numero_nota,
            dataMedicao: med.dat_medicao
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
