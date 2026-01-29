const { Fornecedor, Contrato, Sequencia } = require('../models');

const seedData = async () => {
    try {
        // Verificar se ja existem dados
        const count = await Fornecedor.countDocuments();
        if (count > 0) {
            console.log('Banco de dados ja possui dados. Seed ignorado.');
            return false;
        }

        console.log('Iniciando seed do banco de dados...');

        // Criar fornecedores
        const fornecedores = await Fornecedor.insertMany([
            { nome: 'DI2S' },
            { nome: 'CABTEC' },
            { nome: 'CONTI CONSULTORIA' },
            { nome: 'VIVO' },
            { nome: 'BKP GARANTIDO' },
            { nome: 'SENIOR' }
        ]);

        console.log(`${fornecedores.length} fornecedores criados`);

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

        console.log(`${contratos.length} contratos criados`);

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

        const sequencias = await Sequencia.insertMany(sequenciasData);

        console.log(`${sequencias.length} sequencias criadas`);
        console.log('Seed concluido com sucesso!');

        return true;
    } catch (error) {
        console.error('Erro no seed:', error);
        throw error;
    }
};

module.exports = seedData;
