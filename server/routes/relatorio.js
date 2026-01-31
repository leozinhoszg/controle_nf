const express = require('express');
const router = express.Router();
const { relatorioController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de relatorio
router.use(autenticar);
router.use(autorizarPermissao('relatorio'));

router.get('/tabela', relatorioController.getTabela);
router.get('/resumo', relatorioController.getResumo);
router.post('/seed', relatorioController.seed);

module.exports = router;
