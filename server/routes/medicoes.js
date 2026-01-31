const express = require('express');
const router = express.Router();
const { medicaoController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de contratos (medicoes fazem parte de contratos)
router.use(autenticar);
router.use(autorizarPermissao('contratos'));

// GET /api/medicoes/buscar?contrato=369&estabelecimento=01&sequencia=1
router.get('/buscar', medicaoController.buscar);

// GET /api/medicoes/alertas - Lista medições com alerta de valor
router.get('/alertas', medicaoController.getAlertas);

// GET /api/medicoes/sequencia/:sequenciaId - Lista medições de uma sequência
router.get('/sequencia/:sequenciaId', medicaoController.getBySequencia);

// GET /api/medicoes/sequencia/:sequenciaId/status - Status consolidado
router.get('/sequencia/:sequenciaId/status', medicaoController.getStatusConsolidado);

// POST /api/medicoes/sincronizar/:sequenciaId - Sincroniza uma sequência
router.post('/sincronizar/:sequenciaId', medicaoController.sincronizar);

// POST /api/medicoes/sincronizar-todas - Sincroniza todas as sequências
router.post('/sincronizar-todas', medicaoController.sincronizarTodas);

module.exports = router;
