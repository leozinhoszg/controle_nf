require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const seedData = require('./config/seed');
const routes = require('./routes');

const app = express();

// Trust proxy - necessario para obter IP real atras de proxies/load balancers
// Valores: true (confiar em qualquer proxy), 1 (confiar apenas no primeiro proxy)
// Em producao com nginx/cloudflare, use 'loopback' ou numero de proxies
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

// Middleware
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Servir arquivos estaticos do frontend (build do Vite)
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));

// Rota para o frontend (SPA) - todas as rotas não-API retornam o index.html
app.get('*', (req, res, next) => {
    // Se a rota começa com /api, passa para o próximo handler
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

// Iniciar servidor
const startServer = async () => {
    try {
        // Conectar ao MongoDB
        await connectDB();

        // Executar seed se banco estiver vazio
        await seedData();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`
========================================
  Servidor rodando na porta ${PORT}
========================================

  Frontend: http://localhost:${PORT}
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
