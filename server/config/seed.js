const { Fornecedor, Contrato, Sequencia, Empresa, Estabelecimento } = require('../models');

const seedData = async () => {
    try {
        const count = await Fornecedor.count();
        if (count > 0) {
            console.log('Banco de dados ja possui dados. Seed ignorado.');
            return false;
        }

        console.log('Iniciando seed do banco de dados...');

        const empresas = await Empresa.bulkCreate([
            { cod_empresa: '01', nome: 'PROMA BRASIL' },
            { cod_empresa: '02', nome: 'PMC' }
        ]);

        console.log(`${empresas.length} empresas criadas`);
        const [promaBrasil, pmc] = empresas;

        const estabelecimentos = await Estabelecimento.bulkCreate([
            { empresa_id: promaBrasil.id, cod_estabel: '01', nome: 'PROMA CONTAGEM' },
            { empresa_id: promaBrasil.id, cod_estabel: '02', nome: 'PROMA JUATUBA' },
            { empresa_id: pmc.id, cod_estabel: '101', nome: 'PMC GOIANA' }
        ]);

        console.log(`${estabelecimentos.length} estabelecimentos criados`);

        const fornecedores = await Fornecedor.bulkCreate([
            { nome: 'DI2S' },
            { nome: 'CABTEC' },
            { nome: 'CONTI CONSULTORIA' },
            { nome: 'VIVO' },
            { nome: 'BKP GARANTIDO' },
            { nome: 'SENIOR' }
        ]);

        console.log(`${fornecedores.length} fornecedores criados`);
        const [di2s, cabtec, conti, vivo, bkp, senior] = fornecedores;

        const contratos = await Contrato.bulkCreate([
            { fornecedor_id: di2s.id, nr_contrato: 310, estabelecimento_id: estabelecimentos[0].id, cod_estabel: '01' },
            { fornecedor_id: cabtec.id, nr_contrato: 474, estabelecimento_id: estabelecimentos[0].id, cod_estabel: '01' },
            { fornecedor_id: conti.id, nr_contrato: 684, estabelecimento_id: estabelecimentos[1].id, cod_estabel: '02' },
            { fornecedor_id: vivo.id, nr_contrato: 236, estabelecimento_id: estabelecimentos[0].id, cod_estabel: '01' },
            { fornecedor_id: bkp.id, nr_contrato: 593, estabelecimento_id: estabelecimentos[1].id, cod_estabel: '02', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor_id: bkp.id, nr_contrato: 594, estabelecimento_id: estabelecimentos[0].id, cod_estabel: '01', observacao: 'Necessario atualizacao de contrato' },
            { fornecedor_id: senior.id, nr_contrato: 545, estabelecimento_id: estabelecimentos[1].id, cod_estabel: '02' },
            { fornecedor_id: senior.id, nr_contrato: 545, estabelecimento_id: estabelecimentos[0].id, cod_estabel: '01', observacao: 'Necessario atualizacao de contrato' }
        ]);

        console.log(`${contratos.length} contratos criados`);

        const sequenciasData = [
            { contrato_id: contratos[0].id, num_seq_item: 1, dia_emissao: 15, valor: 3589.20 },
            { contrato_id: contratos[0].id, num_seq_item: 2, dia_emissao: 15, valor: 708.15 },
            { contrato_id: contratos[0].id, num_seq_item: 3, dia_emissao: 15, valor: 436.50 },
            { contrato_id: contratos[0].id, num_seq_item: 4, dia_emissao: 15, valor: 261.16 },
            { contrato_id: contratos[0].id, num_seq_item: 5, dia_emissao: 15, valor: 1343.64 },
            { contrato_id: contratos[0].id, num_seq_item: 11, dia_emissao: 15, valor: 7091.50 },
            { contrato_id: contratos[1].id, num_seq_item: 12, dia_emissao: 15, valor: 214.50 },
            { contrato_id: contratos[1].id, num_seq_item: 13, dia_emissao: 15, valor: 195.80 },
            { contrato_id: contratos[1].id, num_seq_item: 14, dia_emissao: 15, valor: 78.40 },
            { contrato_id: contratos[1].id, num_seq_item: 15, dia_emissao: 15, valor: 2827.50 },
            { contrato_id: contratos[1].id, num_seq_item: 16, dia_emissao: 15, valor: 1007.73 },
            { contrato_id: contratos[1].id, num_seq_item: 17, dia_emissao: 15, valor: 711.00 },
            { contrato_id: contratos[1].id, num_seq_item: 18, dia_emissao: 15, valor: 4355.80 },
            { contrato_id: contratos[2].id, num_seq_item: 3, dia_emissao: 3, valor: 6500.00 },
            { contrato_id: contratos[2].id, num_seq_item: 2, dia_emissao: 3, valor: 2221.31 },
            { contrato_id: contratos[3].id, num_seq_item: 1, dia_emissao: 18, valor: 6960.00 },
            { contrato_id: contratos[4].id, num_seq_item: 1, dia_emissao: 1, valor: 1652.63 },
            { contrato_id: contratos[5].id, num_seq_item: 1, dia_emissao: 1, valor: 1193.93 },
            { contrato_id: contratos[6].id, num_seq_item: 3, dia_emissao: 6, valor: 478.78 },
            { contrato_id: contratos[7].id, num_seq_item: 2, dia_emissao: 1, valor: 5692.01 },
            { contrato_id: contratos[7].id, num_seq_item: 2, dia_emissao: 29, valor: 2012.00 }
        ];

        const sequencias = await Sequencia.bulkCreate(sequenciasData);
        console.log(`${sequencias.length} sequencias criadas`);
        console.log('Seed concluido com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro no seed:', error);
        throw error;
    }
};

module.exports = seedData;
