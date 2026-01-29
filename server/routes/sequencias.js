const express = require('express');
const router = express.Router();
const { sequenciaController } = require('../controllers');

router.get('/', sequenciaController.getAll);
router.get('/buscar', sequenciaController.buscar);
router.get('/:id', sequenciaController.getById);
router.post('/', sequenciaController.create);
router.put('/:id', sequenciaController.update);
router.patch('/:id/status', sequenciaController.updateStatus);
router.delete('/:id', sequenciaController.delete);

module.exports = router;
