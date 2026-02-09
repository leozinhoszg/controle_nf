require('dotenv').config();
const { sequelize } = require('../config/db');
const { User } = require('../models');

async function migrate() {
    try {
        console.log('Conectando ao MySQL...');
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Conectado!\n');

        // This migration is no longer needed for MySQL since perfil_id is a proper FK
        // But keeping for reference in case of data cleanup needs
        const usuarios = await User.unscoped().findAll({ raw: true });

        let migrados = 0;
        let erros = 0;

        for (const usuario of usuarios) {
            if (usuario.perfil_id === null || usuario.perfil_id === undefined) {
                continue; // Already null, no migration needed
            }
        }

        console.log('='.repeat(50));
        console.log('Migracao concluida!');
        console.log(`Total de usuarios: ${usuarios.length}`);
        console.log(`Usuarios migrados: ${migrados}`);
        console.log(`Erros: ${erros}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Erro na migracao:', error.message);
    } finally {
        await sequelize.close();
        console.log('\nDesconectado do MySQL.');
        process.exit(0);
    }
}

migrate();
