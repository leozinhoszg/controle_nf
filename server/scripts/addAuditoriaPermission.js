require('dotenv').config();
const { sequelize } = require('../config/db');
const { Perfil, PerfilPermissao } = require('../models');

async function addAuditoriaPermission() {
    try {
        console.log('Conectando ao MySQL...');
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Conectado!\n');

        const perfisAdmin = await Perfil.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { is_admin: true }
                ]
            },
            include: [{ model: PerfilPermissao, as: 'permissoesRef' }]
        });

        // Also find perfis with 'usuarios' or 'perfis' permission
        const perfisComPermissao = await Perfil.findAll({
            include: [{
                model: PerfilPermissao,
                as: 'permissoesRef',
                where: { permissao: { [require('sequelize').Op.in]: ['usuarios', 'perfis'] } },
                required: true
            }]
        });

        const todosPerfis = [...new Map([...perfisAdmin, ...perfisComPermissao].map(p => [p.id, p])).values()];

        console.log(`Encontrados ${todosPerfis.length} perfil(is) para atualizar:\n`);

        let atualizados = 0;
        let jaTemPermissao = 0;

        for (const perfil of todosPerfis) {
            const permissoes = perfil.permissoesRef ? perfil.permissoesRef.map(p => p.permissao) : [];

            if (permissoes.includes('auditoria')) {
                console.log(`  [SKIP] ${perfil.nome} - ja possui permissao de auditoria`);
                jaTemPermissao++;
                continue;
            }

            await PerfilPermissao.create({ perfil_id: perfil.id, permissao: 'auditoria' });
            console.log(`  [OK] ${perfil.nome} - permissao de auditoria adicionada`);
            atualizados++;
        }

        console.log('\n' + '='.repeat(50));
        console.log('Resumo:');
        console.log(`  - Perfis atualizados: ${atualizados}`);
        console.log(`  - Perfis que ja tinham: ${jaTemPermissao}`);
        console.log('='.repeat(50));
        console.log('Migracao concluida com sucesso!');
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await sequelize.close();
        console.log('\nDesconectado do MySQL.');
        process.exit(0);
    }
}

addAuditoriaPermission();
