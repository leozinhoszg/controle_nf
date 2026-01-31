/**
 * Script de migração para converter campo 'perfil' de string para ObjectId
 *
 * Execute com: node scripts/migratePerfil.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/controle';

async function migrate() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado!\n');

        // Buscar usuarios com perfil string (valor antigo)
        const usuarios = await User.find({}).lean();

        let migrados = 0;
        let erros = 0;

        for (const usuario of usuarios) {
            const perfil = usuario.perfil;

            // Se perfil for string antiga (admin, gerente, usuario), limpar
            if (typeof perfil === 'string' && !perfil.match(/^[0-9a-fA-F]{24}$/)) {
                console.log(`Migrando usuario: ${usuario.usuario} (perfil antigo: "${perfil}")`);

                try {
                    await User.updateOne(
                        { _id: usuario._id },
                        { $set: { perfil: null } }
                    );
                    console.log(`  -> Perfil removido. Admin deve atribuir novo perfil.\n`);
                    migrados++;
                } catch (err) {
                    console.error(`  -> Erro ao migrar: ${err.message}\n`);
                    erros++;
                }
            }
        }

        console.log('='.repeat(50));
        console.log(`Migração concluida!`);
        console.log(`Total de usuarios: ${usuarios.length}`);
        console.log(`Usuarios migrados: ${migrados}`);
        console.log(`Erros: ${erros}`);
        console.log('='.repeat(50));

        if (migrados > 0) {
            console.log('\nATENCAO: Os usuarios migrados ficaram sem perfil.');
            console.log('Um administrador deve atribuir perfis a eles pelo sistema.');
        }

    } catch (error) {
        console.error('Erro na migracao:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB.');
        process.exit(0);
    }
}

migrate();
