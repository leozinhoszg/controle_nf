require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/db');
const { connectDB } = require('./config/db');
const seedData = require('./config/seed');
const routes = require('./routes');

const app = express();

app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

// Middleware
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Servir arquivos estaticos do frontend
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

const startServer = async () => {
    try {
        // Conectar ao MySQL
        await connectDB();

        // Sincronizar modelos (criar tabelas se nao existirem)
        await sequelize.sync();
        console.log('Tabelas sincronizadas com sucesso');

        // Executar seed se banco estiver vazio
        await seedData();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`
========================================
  Servidor rodando na porta ${PORT}
========================================

  Frontend: http://localhost:3000
  API:      http://localhost:${PORT}/api

  Endpoints disponiveis:

  Auth:
  - POST           /api/auth/register
  - POST           /api/auth/login
  - POST           /api/auth/logout
  - POST           /api/auth/refresh-token
  - GET            /api/auth/me
  - POST           /api/auth/forgot-password
  - POST           /api/auth/reset-password/:token

  Recursos:
  - GET/POST       /api/fornecedores
  - GET/PUT/DELETE /api/fornecedores/:id
  - GET/POST       /api/contratos
  - GET/PUT/DELETE /api/contratos/:id
  - GET/POST       /api/sequencias
  - GET/PUT/DELETE /api/sequencias/:id
  - PATCH          /api/sequencias/:id/status
  - GET            /api/relatorio/tabela
  - GET            /api/relatorio/resumo
  - POST           /api/relatorio/seed

  Webhooks (n8n):
  - GET/POST       /api/webhooks
  - GET/PUT/DELETE /api/webhooks/:id
  - GET            /api/webhooks/eventos
  - POST           /api/webhooks/:id/testar
  - POST           /api/webhooks/verificar-atrasadas
  - POST           /api/webhooks/enviar-resumo

  Medicoes (API ERP):
  - GET            /api/medicoes/buscar?contrato=&estabelecimento=&sequencia=
  - GET            /api/medicoes/alertas
  - GET            /api/medicoes/sequencia/:id
  - GET            /api/medicoes/sequencia/:id/status
  - POST           /api/medicoes/sincronizar/:sequenciaId
  - POST           /api/medicoes/sincronizar-todas

========================================
            `);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();
