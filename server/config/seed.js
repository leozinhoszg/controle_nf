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
            { fornecedor: di2s._id, numero: 310, estabelecimento: 1 },
            { fornecedor: cabtec._id, numero: 474, estabelecimento: 1 },
            { fornecedor: conti._id, numero: 684, estabelecimento: 2 },
            { fornecedor: vivo._id, numero: 236, estabelecimento: 1 },
            { fornecedor: bkp._id, numero: 593, estabelecimento: 2, observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: bkp._id, numero: 594, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' },
            { fornecedor: senior._id, numero: 545, estabelecimento: 2 },
            { fornecedor: senior._id, numero: 545, estabelecimento: 1, observacao: 'Necessario atualizacao de contrato' }
        ]);

        console.log(`${contratos.length} contratos criados`);

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
