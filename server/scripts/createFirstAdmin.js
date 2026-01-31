/**
 * Script para criar o primeiro usuario administrador do sistema
 *
 * Use este script na primeira vez que a aplicacao for utilizada
 * para criar um usuario admin com acesso total.
 *
 * Execute com: node scripts/createFirstAdmin.js
 *
 * Credenciais padrao:
 *   Usuario: admin
 *   Senha: admin123
 *   Email: admin@sistema.com
 *
 * IMPORTANTE: Altere a senha apos o primeiro login!
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Perfil } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/controle';

// Dados do usuario administrador inicial
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
        console.log('\nConectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado!\n');

        // Verificar se ja existe algum usuario no sistema
        const totalUsuarios = await User.countDocuments();

        if (totalUsuarios > 0) {
            console.log('AVISO: Ja existem usuarios cadastrados no sistema.');
            console.log(`Total de usuarios: ${totalUsuarios}`);
            console.log('\nEste script so deve ser executado na primeira utilizacao.');
            console.log('Para criar novos admins, use o painel de usuarios.\n');

            // Verificar se existe o usuario admin
            const adminExistente = await User.findOne({ usuario: 'admin' });
            if (adminExistente) {
                console.log('O usuario "admin" ja existe no sistema.');
            }

            return;
        }

        // Criar ou obter perfil Administrador
        console.log('Verificando perfil Administrador...');
        let perfilAdmin = await Perfil.findOne({ isAdmin: true });

        if (!perfilAdmin) {
            console.log('Criando perfil Administrador...');
            perfilAdmin = new Perfil({
                nome: 'Administrador',
                descricao: 'Acesso total ao sistema',
                permissoes: ['dashboard', 'fornecedores', 'contratos', 'relatorio', 'usuarios', 'perfis'],
                isAdmin: true,
                ativo: true
            });
            await perfilAdmin.save();
            console.log('Perfil Administrador criado com sucesso!\n');
        } else {
            console.log('Perfil Administrador ja existe.\n');
        }

        // Criar usuario administrador
        console.log('Criando usuario administrador...');

        const novoAdmin = new User({
            usuario: ADMIN_USER.usuario,
            email: ADMIN_USER.email,
            senha: ADMIN_USER.senha,
            nome: ADMIN_USER.nome,
            perfil: perfilAdmin._id,
            ativo: true,
            emailVerificado: true // Ja verificado para uso imediato
        });

        await novoAdmin.save();

        console.log('\n' + '='.repeat(60));
        console.log('  USUARIO ADMINISTRADOR CRIADO COM SUCESSO!');
        console.log('='.repeat(60));
        console.log('\n  Credenciais de acesso:');
        console.log('  -----------------------');
        console.log(`  Usuario: ${ADMIN_USER.usuario}`);
        console.log(`  Senha:   ${ADMIN_USER.senha}`);
        console.log(`  Email:   ${ADMIN_USER.email}`);
        console.log('\n  IMPORTANTE: Altere a senha apos o primeiro login!');
        console.log('='.repeat(60));

    } catch (error) {
        if (error.code === 11000) {
            console.error('\nERRO: Usuario ou email ja existe no sistema.');
            console.error('Detalhes:', error.message);
        } else {
            console.error('\nErro ao criar usuario:', error.message);
        }
    } finally {
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB.');
        process.exit(0);
    }
}

createFirstAdmin();
