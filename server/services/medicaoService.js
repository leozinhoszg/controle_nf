const axios = require('axios');
const { Medicao, Sequencia, Contrato } = require('../models');

const ERP_API_URL = process.env.ERP_API_URL;
const ERP_USERNAME = process.env.ERP_USERNAME;
const ERP_PASSWORD = process.env.ERP_PASSWORD;

async function buscarMedicoesERP(nrContrato, codEstabel, numSeqItem) {
    const requestBody = {
        'tt-param': [{
            'nr-contrato': parseInt(nrContrato),
            'cod-estabel': String(codEstabel).padStart(2, '0'),
            'num-seq-item': parseInt(numSeqItem)
        }]
    };

    console.log('=== Requisicao API ERP ===');
    console.log('URL:', ERP_API_URL);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    try {
        const response = await axios.request({
            method: 'GET',
            url: ERP_API_URL,
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
            auth: { username: ERP_USERNAME, password: ERP_PASSWORD },
            data: requestBody
        });

        console.log('=== Resposta API ERP ===');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));

        const items = response.data?.items || [];
        if (items.length === 0) {
            console.log('Nenhuma medicao encontrada');
            return [];
        }

        const medicoes = items[0]?.TTJson || [];
        console.log(`Medicoes encontradas: ${medicoes.length}`);
        return medicoes;
    } catch (error) {
        console.error('=== Erro API ERP ===');
        console.error('Mensagem:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

function extrairMesReferencia(data) {
    const date = new Date(data);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function determinarMesReferencia(medicaoERP) {
    if (medicaoERP['dat-prev-medicao']) {
        return extrairMesReferencia(medicaoERP['dat-prev-medicao']);
    }
    return extrairMesReferencia(medicaoERP['dat-medicao']);
}

async function sincronizarMedicoes(sequencia) {
    const contrato = sequencia.contrato;
    if (!contrato) throw new Error('Sequencia sem contrato vinculado');

    const nrContrato = contrato.nr_contrato;
    const codEstabel = contrato.cod_estabel;
    const numSeqItem = sequencia.num_seq_item;

    const medicoesERP = await buscarMedicoesERP(nrContrato, codEstabel, numSeqItem);
    const medicoesProcessadas = [];

    for (const med of medicoesERP) {
        const mesReferencia = determinarMesReferencia(med);
        const notaRegistrada = med['sld-val-medicao'] === 0 && med['numero-nota'];
        const statusRegistro = notaRegistrada ? 'registrada' : 'nao_registrada';

        const valorMedicao = med['val-medicao'];
        const valorEsperado = sequencia.valor;
        const alertaValor = Math.abs(valorMedicao - valorEsperado) > 0.01;
        const diferencaValor = valorMedicao - valorEsperado;

        const dadosMedicao = {
            sequencia_id: sequencia.id,
            num_seq_medicao: med['num-seq-medicao'],
            cod_estabel: med['cod-estabel'],
            serie_nota: med['serie-nota'] || '',
            sld_val_medicao: med['sld-val-medicao'],
            num_seq_item: med['num-seq-item'],
            numero_ordem: med['numero-ordem'],
            val_medicao: med['val-medicao'],
            dat_medicao: new Date(med['dat-medicao']),
            sld_rec_medicao: med['sld-rec-medicao'],
            nr_contrato: med['nr-contrato'],
            dat_prev_medicao: med['dat-prev-medicao'] ? new Date(med['dat-prev-medicao']) : null,
            numero_nota: med['numero-nota'] || '',
            nome_emit: med['nome-emit'] || '',
            dat_receb: med['dat-receb'] ? new Date(med['dat-receb']) : null,
            responsavel: med['responsavel'] || '',
            mes_referencia: mesReferencia,
            status_registro: statusRegistro,
            alerta_valor: alertaValor,
            diferenca_valor: diferencaValor,
            sincronizado_em: new Date()
        };

        await Medicao.upsert(dadosMedicao);

        const medicao = await Medicao.findOne({
            where: {
                nr_contrato: nrContrato,
                cod_estabel: codEstabel,
                num_seq_item: numSeqItem,
                num_seq_medicao: med['num-seq-medicao']
            }
        });

        medicoesProcessadas.push(medicao);
    }

    return medicoesProcessadas;
}

async function buscarMedicoesLocais(sequenciaId) {
    return Medicao.findAll({
        where: { sequencia_id: sequenciaId },
        order: [['dat_medicao', 'DESC']]
    });
}

async function buscarMedicoesPorContrato(nrContrato, codEstabel, numSeqItem) {
    return Medicao.findAll({
        where: {
            nr_contrato: nrContrato,
            cod_estabel: codEstabel,
            num_seq_item: numSeqItem
        },
        order: [['dat_medicao', 'DESC']]
    });
}

async function calcularStatusMensal(sequencia, mesKey) {
    const hoje = new Date();
    const [ano, mes] = mesKey.split('-').map(Number);
    const diaEmissao = sequencia.dia_emissao;
    const dataLimite = new Date(ano, mes - 1, diaEmissao);

    const medicoes = await Medicao.findAll({
        where: { sequencia_id: sequencia.id, mes_referencia: mesKey }
    });

    if (medicoes.length === 0) {
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        const ehMesAtual = (ano === anoAtual && mes === mesAtual);

        if (!ehMesAtual && dataLimite > hoje) return 'futuro';
        if (ehMesAtual && dataLimite > hoje) return 'pendente';
        if (hoje > dataLimite) return 'atrasada';
        return 'pendente';
    }

    const temRegistrada = medicoes.some(m => m.status_registro === 'registrada');
    if (temRegistrada) return 'ok';
    return 'nao_registrada';
}

async function atualizarStatusMensal(sequenciaId) {
    const sequencia = await Sequencia.findByPk(sequenciaId);
    if (!sequencia) throw new Error('Sequencia nao encontrada');

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const statusMensal = sequencia.status_mensal || {};

    for (let mes = 1; mes <= 12; mes++) {
        const mesKey = `${anoAtual}-${String(mes).padStart(2, '0')}`;
        const status = await calcularStatusMensal(sequencia, mesKey);
        const statusAtual = statusMensal[mesKey];
        if (statusAtual !== 'ok' || status === 'ok') {
            statusMensal[mesKey] = status;
        }
    }

    sequencia.status_mensal = statusMensal;
    sequencia.changed('status_mensal', true);
    await sequencia.save();
    return sequencia;
}

async function sincronizarTodas() {
    const sequencias = await Sequencia.findAll({
        include: [{
            model: Contrato,
            as: 'contrato',
            include: [{ model: require('../models').Fornecedor, as: 'fornecedor' }]
        }]
    });

    const resultados = [];
    for (const seq of sequencias) {
        try {
            const medicoes = await sincronizarMedicoes(seq);
            await atualizarStatusMensal(seq.id);
            resultados.push({
                sequencia: seq.id,
                contrato: seq.contrato?.nr_contrato,
                sucesso: true,
                medicoes: medicoes.length
            });
        } catch (error) {
            resultados.push({
                sequencia: seq.id,
                contrato: seq.contrato?.nr_contrato,
                sucesso: false,
                erro: error.message
            });
        }
    }
    return resultados;
}

module.exports = {
    buscarMedicoesERP,
    sincronizarMedicoes,
    buscarMedicoesLocais,
    buscarMedicoesPorContrato,
    calcularStatusMensal,
    atualizarStatusMensal,
    sincronizarTodas,
    extrairMesReferencia,
    determinarMesReferencia
};
