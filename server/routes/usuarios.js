const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao e permissao de usuarios
router.use(autenticar);
router.use(autorizarPermissao('usuarios'));

// CRUD de usuarios
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

// Acoes especiais
router.patch('/:id/senha', userController.alterarSenha);
router.patch('/:id/toggle-ativo', userController.toggleAtivo);

module.exports = router;
