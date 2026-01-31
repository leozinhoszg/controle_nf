const express = require('express');
const router = express.Router();
const { perfilController } = require('../controllers');
const { autenticar, autorizarPermissao } = require('../middleware/auth');

// Todas as rotas requerem autenticacao
router.use(autenticar);

// Listar permissoes disponiveis (qualquer usuario autenticado pode ver)
router.get('/permissoes', perfilController.getPermissoesDisponiveis);

// Rotas que requerem permissao de perfis
router.get('/', autorizarPermissao('perfis'), perfilController.getAll);
router.get('/:id', autorizarPermissao('perfis'), perfilController.getById);
router.post('/', autorizarPermissao('perfis'), perfilController.create);
router.put('/:id', autorizarPermissao('perfis'), perfilController.update);
router.delete('/:id', autorizarPermissao('perfis'), perfilController.delete);

module.exports = router;
