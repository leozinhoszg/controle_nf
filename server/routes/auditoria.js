const express = require('express');
const router = express.Router();
const { auditController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de auditoria
router.use(autenticar);
router.use(autorizarPermissao('auditoria'));

// Listar logs com filtros e paginacao
router.get('/', auditController.getLogs);

// Estatisticas de auditoria
router.get('/estatisticas', auditController.getEstatisticas);

// Listar categorias disponiveis
router.get('/categorias', auditController.getCategorias);

// Listar acoes disponiveis
router.get('/acoes', auditController.getAcoes);

// Exportar logs (CSV ou JSON)
router.get('/exportar', auditController.exportar);

// Historico de um recurso especifico
router.get('/historico/:recurso/:recursoId', auditController.getHistorico);

// Logs de um usuario especifico
router.get('/usuario/:usuarioId', auditController.getLogsByUsuario);

module.exports = router;
