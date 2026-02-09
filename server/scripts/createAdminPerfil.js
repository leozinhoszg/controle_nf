require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Perfil, PerfilPermissao } = require('../models');

async function createAdmin() {
    try {
        console.log('Conectando ao MySQL...');
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Conectado!\n');

        let perfilAdmin = await Perfil.findOne({ where: { is_admin: true } });

        if (!perfilAdmin) {
            console.log('Criando perfil Administrador...');
            perfilAdmin = await Perfil.create({
                nome: 'Administrador',
                descricao: 'Acesso total ao sistema',
                is_admin: true,
                ativo: true
            });
            await PerfilPermissao.bulkCreate([
                'dashboard', 'fornecedores', 'contratos', 'relatorio', 'usuarios', 'perfis', 'auditoria'
            ].map(p => ({ perfil_id: perfilAdmin.id, permissao: p })));
            console.log('Perfil Administrador criado com sucesso!\n');
        } else {
            console.log('Perfil Administrador ja existe.\n');
        }

        const usuariosSemPerfil = await User.findAll({ where: { perfil_id: null } });

        if (usuariosSemPerfil.length > 0) {
            console.log(`Encontrados ${usuariosSemPerfil.length} usuario(s) sem perfil:`);
            for (const usuario of usuariosSemPerfil) {
                console.log(`  - ${usuario.usuario} (${usuario.email})`);
            }
            const primeiroUsuario = usuariosSemPerfil[0];
            await User.update({ perfil_id: perfilAdmin.id }, { where: { id: primeiroUsuario.id } });
            console.log(`\nPerfil Administrador atribuido ao usuario: ${primeiroUsuario.usuario}`);
        } else {
            console.log('Todos os usuarios ja possuem perfil.');
        }

        console.log('\n' + '='.repeat(50));
        console.log('Operacao concluida com sucesso!');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await sequelize.close();
        console.log('\nDesconectado do MySQL.');
        process.exit(0);
    }
}

createAdmin();
