const express = require('express');
const router = express.Router();
const { webhookController } = require('../controllers');

// CRUD de webhooks
router.get('/', webhookController.getAll);
router.get('/eventos', webhookController.getEventos);
router.get('/:id', webhookController.getById);
router.post('/', webhookController.create);
router.put('/:id', webhookController.update);
router.delete('/:id', webhookController.delete);

// Acoes de webhook
router.post('/:id/testar', webhookController.testar);
router.post('/verificar-atrasadas', webhookController.verificarAtrasadas);
router.post('/enviar-resumo', webhookController.enviarResumo);

module.exports = router;
