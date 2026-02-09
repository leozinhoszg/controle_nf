require('dotenv').config();
const { sequelize } = require('./db');
const { User, Perfil, PerfilPermissao } = require('../models');

const criarUsuarioAdmin = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Conectado ao MySQL');

        const adminExistente = await User.unscoped().findOne({ where: { usuario: 'admin' } });
        if (adminExistente) {
            console.log('Usuario admin ja existe:');
            console.log(`  Usuario: ${adminExistente.usuario}`);
            console.log(`  Email: ${adminExistente.email}`);
            return;
        }

        let perfilAdmin = await Perfil.findOne({ where: { is_admin: true } });
        if (!perfilAdmin) {
            perfilAdmin = await Perfil.create({
                nome: 'Administrador',
                descricao: 'Acesso total ao sistema',
                is_admin: true,
                ativo: true
            });
            await PerfilPermissao.bulkCreate([
                'dashboard', 'fornecedores', 'contratos', 'relatorio', 'usuarios', 'perfis', 'auditoria'
            ].map(p => ({ perfil_id: perfilAdmin.id, permissao: p })));
        }

        const admin = await User.create({
            usuario: 'admin',
            email: 'admin@sistema.local',
            senha: 'Admin@123',
            perfil_id: perfilAdmin.id,
            ativo: true,
            email_verificado: true,
            conta_ativada: true
        });

        console.log('Usuario admin criado com sucesso!');
        console.log('================================');
        console.log('  Usuario: admin');
        console.log('  Email: admin@sistema.local');
        console.log('  Senha: Admin@123');
        console.log('================================');
        console.log('IMPORTANTE: Altere a senha apos o primeiro login!');
    } catch (error) {
        console.error('Erro ao criar usuario admin:', error.message);
    } finally {
        await sequelize.close();
        console.log('Desconectado do MySQL');
    }
};

if (require.main === module) {
    criarUsuarioAdmin();
}

module.exports = criarUsuarioAdmin;
