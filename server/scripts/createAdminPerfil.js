/**
 * Script para criar perfil Admin e atribuir ao primeiro usuario
 *
 * Execute com: node scripts/createAdminPerfil.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Perfil } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/controle';

async function createAdmin() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado!\n');

        // Verificar se ja existe um perfil Admin
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

        // Buscar usuarios sem perfil
        const usuariosSemPerfil = await User.find({ perfil: null });

        if (usuariosSemPerfil.length > 0) {
            console.log(`Encontrados ${usuariosSemPerfil.length} usuario(s) sem perfil:`);

            for (const usuario of usuariosSemPerfil) {
                console.log(`  - ${usuario.usuario} (${usuario.email})`);
            }

            // Atribuir perfil Admin ao primeiro usuario
            const primeiroUsuario = usuariosSemPerfil[0];
            await User.updateOne(
                { _id: primeiroUsuario._id },
                { $set: { perfil: perfilAdmin._id } }
            );
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
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB.');
        process.exit(0);
    }
}

createAdmin();
