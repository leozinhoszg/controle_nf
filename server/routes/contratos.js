const express = require('express');
const router = express.Router();
const { contratoController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de contratos
router.use(autenticar);
router.use(autorizarPermissao('contratos'));

router.get('/', contratoController.getAll);
router.get('/:id', contratoController.getById);
router.post('/', contratoController.create);
router.put('/:id', contratoController.update);
router.delete('/:id', contratoController.delete);

module.exports = router;
