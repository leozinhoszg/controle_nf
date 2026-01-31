const express = require('express');
const router = express.Router();
const { sequenciaController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de contratos (sequencias fazem parte de contratos)
router.use(autenticar);
router.use(autorizarPermissao('contratos'));

router.get('/', sequenciaController.getAll);
router.get('/buscar', sequenciaController.buscar);
router.get('/:id', sequenciaController.getById);
router.post('/', sequenciaController.create);
router.put('/:id', sequenciaController.update);
router.patch('/:id/status', sequenciaController.updateStatus);
router.delete('/:id', sequenciaController.delete);

module.exports = router;
