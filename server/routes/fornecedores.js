const express = require('express');
const router = express.Router();
const { fornecedorController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de fornecedores
router.use(autenticar);
router.use(autorizarPermissao('fornecedores'));

router.get('/', fornecedorController.getAll);
router.get('/:id', fornecedorController.getById);
router.post('/', fornecedorController.create);
router.put('/:id', fornecedorController.update);
router.delete('/:id', fornecedorController.delete);

module.exports = router;
