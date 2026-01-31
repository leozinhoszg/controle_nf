/**
 * Script para adicionar permissao 'auditoria' aos perfis de administradores
 *
 * Execute com: node scripts/addAuditoriaPermission.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Perfil } = require('../models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/controle';

async function addAuditoriaPermission() {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado!\n');

        // Buscar perfis admin ou que ja tenham a maioria das permissoes
        const perfisAdmin = await Perfil.find({
            $or: [
                { isAdmin: true },
                { permissoes: { $in: ['usuarios', 'perfis'] } }
            ]
        });

        console.log(`Encontrados ${perfisAdmin.length} perfil(is) para atualizar:\n`);

        let atualizados = 0;
        let jaTemPermissao = 0;

        for (const perfil of perfisAdmin) {
            // Verificar se ja tem a permissao
            if (perfil.permissoes.includes('auditoria')) {
                console.log(`  [SKIP] ${perfil.nome} - ja possui permissao de auditoria`);
                jaTemPermissao++;
                continue;
            }

            // Adicionar permissao
            perfil.permissoes.push('auditoria');
            await perfil.save();
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
        await mongoose.disconnect();
        console.log('\nDesconectado do MongoDB.');
        process.exit(0);
    }
}

addAuditoriaPermission();
