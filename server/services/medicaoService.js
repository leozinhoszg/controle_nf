const axios = require('axios');
const { Medicao, Sequencia, Contrato } = require('../models');

// Configuração da API do ERP
const ERP_API_URL = process.env.ERP_API_URL;
const ERP_USERNAME = process.env.ERP_USERNAME;
const ERP_PASSWORD = process.env.ERP_PASSWORD;

/**
 * Busca medições da API do ERP
 * @param {number} nrContrato - Número do contrato
 * @param {string} codEstabel - Código do estabelecimento ('01' ou '02')
 * @param {number} numSeqItem - Número da sequência do item
 */
async function buscarMedicoesERP(nrContrato, codEstabel, numSeqItem) {
    const requestBody = {
        'tt-param': [{
            'nr-contrato': parseInt(nrContrato),
            'cod-estabel': String(codEstabel).padStart(2, '0'),
            'num-seq-item': parseInt(numSeqItem)
        }]
    };

    console.log('=== Requisição API ERP ===');
    console.log('URL:', ERP_API_URL);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    try {
        // GET com body JSON (não é padrão HTTP, mas APIs TOTVS/Progress usam)
        const response = await axios.request({
            method: 'GET',
            url: ERP_API_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: ERP_USERNAME,
                password: ERP_PASSWORD
            },
            data: requestBody
        });

        console.log('=== Resposta API ERP ===');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));

        // Extrair medições do retorno da API
        const items = response.data?.items || [];
        if (items.length === 0) {
            console.log('Nenhuma medição encontrada');
            return [];
        }

        const medicoes = items[0]?.TTJson || [];
        console.log(`Medições encontradas: ${medicoes.length}`);
        return medicoes;
    } catch (error) {
        console.error('=== Erro API ERP ===');
        console.error('Mensagem:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
        }
        if (error.request) {
            console.error('Request config:', JSON.stringify({
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data
            }, null, 2));
        }
        throw error;
    }
}

/**
 * Extrai o mês de referência de uma data
 * @param {string|Date} data - Data no formato YYYY-MM-DD ou objeto Date
 */
function extrairMesReferencia(data) {
    const date = new Date(data);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Determina o mês de referência da medição
 * Usa dat-prev-medicao (data de emissão da nota) se disponível,
 * caso contrário usa dat-medicao (data TI)
 * @param {Object} medicaoERP - Objeto da medição vinda do ERP
 */
function determinarMesReferencia(medicaoERP) {
    // dat-prev-medicao é a data de emissão da nota pelo fornecedor
    // Esta é a data que define o mês de referência da medição
    if (medicaoERP['dat-prev-medicao']) {
        return extrairMesReferencia(medicaoERP['dat-prev-medicao']);
    }
    // Fallback para dat-medicao (data TI) se dat-prev-medicao não disponível
    return extrairMesReferencia(medicaoERP['dat-medicao']);
}

/**
 * Sincroniza medições da API do ERP para o banco local
 * @param {Object} sequencia - Documento da sequência com contrato populado
 */
async function sincronizarMedicoes(sequencia) {
    const contrato = sequencia.contrato;
    if (!contrato) {
        throw new Error('Sequência sem contrato vinculado');
    }

    const nrContrato = contrato['nr-contrato'];
    const codEstabel = contrato['cod-estabel'];
    const numSeqItem = sequencia['num-seq-item'];

    // Buscar medições da API do ERP
    const medicoesERP = await buscarMedicoesERP(nrContrato, codEstabel, numSeqItem);
    const medicoesProcessadas = [];

    for (const med of medicoesERP) {
        const mesReferencia = determinarMesReferencia(med);

        // Determinar status de registro
        // sld-val-medicao = 0 significa que a nota foi registrada
        const notaRegistrada = med['sld-val-medicao'] === 0 && med['numero-nota'];
        const statusRegistro = notaRegistrada ? 'registrada' : 'nao_registrada';

        // Verificar diferença de valor (alerta se valor diferente do esperado)
        const valorMedicao = med['val-medicao'];
        const valorEsperado = sequencia.valor;
        const alertaValor = Math.abs(valorMedicao - valorEsperado) > 0.01;
        const diferencaValor = valorMedicao - valorEsperado;

        // Upsert da medição (atualiza se existe, cria se não)
        const medicao = await Medicao.findOneAndUpdate(
            {
                'nr-contrato': nrContrato,
                'cod-estabel': codEstabel,
                'num-seq-item': numSeqItem,
                'num-seq-medicao': med['num-seq-medicao']
            },
            {
                sequencia: sequencia._id,
                'num-seq-medicao': med['num-seq-medicao'],
                'cod-estabel': med['cod-estabel'],
                'serie-nota': med['serie-nota'] || '',
                'sld-val-medicao': med['sld-val-medicao'],
                'num-seq-item': med['num-seq-item'],
                'numero-ordem': med['numero-ordem'],
                'val-medicao': med['val-medicao'],
                'dat-medicao': new Date(med['dat-medicao']),
                'sld-rec-medicao': med['sld-rec-medicao'],
                'nr-contrato': med['nr-contrato'],
                'dat-prev-medicao': med['dat-prev-medicao'] ? new Date(med['dat-prev-medicao']) : null,
                'numero-nota': med['numero-nota'] || '',
                'nome-emit': med['nome-emit'] || '',
                'dat-receb': med['dat-receb'] ? new Date(med['dat-receb']) : null,
                'responsavel': med['responsavel'] || '',
                mesReferencia,
                statusRegistro,
                alertaValor,
                diferencaValor,
                sincronizadoEm: new Date()
            },
            { upsert: true, new: true }
        );

        medicoesProcessadas.push(medicao);
    }

    return medicoesProcessadas;
}

/**
 * Busca medições do banco local para uma sequência
 * @param {string} sequenciaId - ID da sequência
 */
async function buscarMedicoesLocais(sequenciaId) {
    return Medicao.find({ sequencia: sequenciaId })
        .sort({ 'dat-medicao': -1 });
}

/**
 * Busca medições do banco local por parâmetros do contrato
 * @param {number} nrContrato - Número do contrato
 * @param {string} codEstabel - Código do estabelecimento
 * @param {number} numSeqItem - Número da sequência
 */
async function buscarMedicoesPorContrato(nrContrato, codEstabel, numSeqItem) {
    return Medicao.find({
        'nr-contrato': nrContrato,
        'cod-estabel': codEstabel,
        'num-seq-item': numSeqItem
    }).sort({ 'dat-medicao': -1 });
}

/**
 * Calcula o status mensal baseado nas medições
 * @param {Object} sequencia - Documento da sequência
 * @param {string} mesKey - Chave do mês (YYYY-MM)
 */
async function calcularStatusMensal(sequencia, mesKey) {
    const hoje = new Date();
    const [ano, mes] = mesKey.split('-').map(Number);
    const diaEmissao = sequencia.diaEmissao;

    // Data limite para emissão neste mês
    const dataLimite = new Date(ano, mes - 1, diaEmissao);

    // Buscar medições do mês
    const medicoes = await Medicao.find({
        sequencia: sequencia._id,
        mesReferencia: mesKey
    });

    // Se não há medições
    if (medicoes.length === 0) {
        // Verificar se estamos no mês atual
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        const ehMesAtual = (ano === anoAtual && mes === mesAtual);

        // Mês futuro (não é o mês atual e data limite ainda não chegou)
        if (!ehMesAtual && dataLimite > hoje) {
            return 'futuro';
        }
        // Mês atual mas ainda não chegou o dia de emissão - mostrar pendente
        if (ehMesAtual && dataLimite > hoje) {
            return 'pendente';
        }
        // Passou da data e não tem medição
        if (hoje > dataLimite) {
            return 'atrasada';
        }
        return 'pendente';
    }

    // Verificar se alguma medição foi registrada (nota fiscal registrada)
    const temRegistrada = medicoes.some(m => m.statusRegistro === 'registrada');

    if (temRegistrada) {
        return 'ok';
    }

    // Tem medição mas não foi registrada ainda
    return 'nao_registrada';
}

/**
 * Atualiza status mensal de uma sequência baseado nas medições
 * @param {string} sequenciaId - ID da sequência
 */
async function atualizarStatusMensal(sequenciaId) {
    const sequencia = await Sequencia.findById(sequenciaId);
    if (!sequencia) {
        throw new Error('Sequência não encontrada');
    }

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();

    // Verificar os 12 meses do ano atual
    for (let mes = 1; mes <= 12; mes++) {
        const mesKey = `${anoAtual}-${String(mes).padStart(2, '0')}`;
        const status = await calcularStatusMensal(sequencia, mesKey);

        // Atualizar apenas se diferente do status salvo manualmente (ok salvo pelo usuário)
        const statusAtual = sequencia.statusMensal?.get(mesKey);
        if (statusAtual !== 'ok' || status === 'ok') {
            sequencia.statusMensal.set(mesKey, status);
        }
    }

    await sequencia.save();
    return sequencia;
}

/**
 * Sincroniza todas as sequências com a API do ERP
 */
async function sincronizarTodas() {
    const sequencias = await Sequencia.find()
        .populate({
            path: 'contrato',
            populate: { path: 'fornecedor' }
        });

    const resultados = [];
    for (const seq of sequencias) {
        try {
            const medicoes = await sincronizarMedicoes(seq);
            await atualizarStatusMensal(seq._id);
            resultados.push({
                sequencia: seq._id,
                contrato: seq.contrato?.['nr-contrato'],
                sucesso: true,
                medicoes: medicoes.length
            });
        } catch (error) {
            resultados.push({
                sequencia: seq._id,
                contrato: seq.contrato?.['nr-contrato'],
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
