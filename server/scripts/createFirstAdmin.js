require('dotenv').config();
const { sequelize } = require('../config/db');
const { User, Perfil, PerfilPermissao } = require('../models');

const ADMIN_USER = {
    usuario: 'admin',
    email: 'admin@sistema.com',
    senha: 'admin123',
    nome: 'Administrador do Sistema'
};

async function createFirstAdmin() {
    try {
        console.log('='.repeat(60));
        console.log('  CRIACAO DO PRIMEIRO USUARIO ADMINISTRADOR');
        console.log('='.repeat(60));
        console.log('\nConectando ao MySQL...');
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Conectado!\n');

        const totalUsuarios = await User.count();
        if (totalUsuarios > 0) {
            console.log('AVISO: Ja existem usuarios cadastrados no sistema.');
            console.log(`Total de usuarios: ${totalUsuarios}`);
            console.log('\nEste script so deve ser executado na primeira utilizacao.');
            const adminExistente = await User.unscoped().findOne({ where: { usuario: 'admin' } });
            if (adminExistente) {
                console.log('O usuario "admin" ja existe no sistema.');
            }
            return;
        }

        console.log('Verificando perfil Administrador...');
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

        console.log('Criando usuario administrador...');
        await User.create({
            usuario: ADMIN_USER.usuario,
            email: ADMIN_USER.email,
            senha: ADMIN_USER.senha,
            nome: ADMIN_USER.nome,
            perfil_id: perfilAdmin.id,
            ativo: true,
            email_verificado: true,
            conta_ativada: true
        });

        console.log('\n' + '='.repeat(60));
        console.log('  USUARIO ADMINISTRADOR CRIADO COM SUCESSO!');
        console.log('='.repeat(60));
        console.log(`\n  Usuario: ${ADMIN_USER.usuario}`);
        console.log(`  Senha:   ${ADMIN_USER.senha}`);
        console.log(`  Email:   ${ADMIN_USER.email}`);
        console.log('\n  IMPORTANTE: Altere a senha apos o primeiro login!');
        console.log('='.repeat(60));
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('\nERRO: Usuario ou email ja existe no sistema.');
        } else {
            console.error('\nErro ao criar usuario:', error.message);
        }
    } finally {
        await sequelize.close();
        console.log('\nDesconectado do MySQL.');
        process.exit(0);
    }
}

createFirstAdmin();
