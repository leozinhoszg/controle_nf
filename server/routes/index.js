const express = require('express');
const router = express.Router();

const fornecedoresRoutes = require('./fornecedores');
const contratosRoutes = require('./contratos');
const sequenciasRoutes = require('./sequencias');
const relatorioRoutes = require('./relatorio');
const webhooksRoutes = require('./webhooks');
const medicoesRoutes = require('./medicoes');
const authRoutes = require('./auth');
const usuariosRoutes = require('./usuarios');
const perfisRoutes = require('./perfis');
const auditoriaRoutes = require('./auditoria');
const empresasRoutes = require('./empresas');
const estabelecimentosRoutes = require('./estabelecimentos');

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// API docs
router.get('/', (req, res) => {
    res.json({
        nome: 'PROMA SIGMA API',
        versao: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                logout: 'POST /api/auth/logout',
                refreshToken: 'POST /api/auth/refresh-token',
                me: 'GET /api/auth/me',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password/:token'
            },
            fornecedores: 'GET|POST /api/fornecedores, GET|PUT|DELETE /api/fornecedores/:id',
            contratos: 'GET|POST /api/contratos, GET|PUT|DELETE /api/contratos/:id',
            sequencias: 'GET|POST /api/sequencias, GET|PUT|DELETE /api/sequencias/:id, PATCH /api/sequencias/:id/status',
            relatorio: 'GET /api/relatorio/tabela, GET /api/relatorio/resumo, POST /api/relatorio/seed',
            webhooks: 'GET|POST /api/webhooks, GET|PUT|DELETE /api/webhooks/:id, GET /api/webhooks/eventos, POST /api/webhooks/:id/testar',
            medicoes: 'GET /api/medicoes/buscar, GET /api/medicoes/alertas, GET /api/medicoes/sequencia/:id, POST /api/medicoes/sincronizar/:sequenciaId',
            usuarios: 'GET|POST /api/usuarios, GET|PUT|DELETE /api/usuarios/:id',
            perfis: 'GET|POST /api/perfis, GET|PUT|DELETE /api/perfis/:id',
            auditoria: 'GET /api/auditoria',
            empresas: 'GET|POST /api/empresas, GET|PUT|DELETE /api/empresas/:id',
            estabelecimentos: 'GET|POST /api/estabelecimentos, GET|PUT|DELETE /api/estabelecimentos/:id'
        }
    });
});

// Rotas de autenticacao
router.use('/auth', authRoutes);

// Rotas da API
router.use('/fornecedores', fornecedoresRoutes);
router.use('/contratos', contratosRoutes);
router.use('/sequencias', sequenciasRoutes);
router.use('/relatorio', relatorioRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/medicoes', medicoesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/perfis', perfisRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/empresas', empresasRoutes);
router.use('/estabelecimentos', estabelecimentosRoutes);

module.exports = router;
