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

module.exports = router;
