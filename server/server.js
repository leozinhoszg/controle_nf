require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const seedData = require('./config/seed');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estaticos do frontend
app.use(express.static(path.join(__dirname, '..')));

// Rotas da API
app.use('/api', routes);

// Rota para o frontend (SPA)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
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

========================================
            `);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

startServer();
