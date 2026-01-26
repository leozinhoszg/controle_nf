const express = require('express');
const router = express.Router();
const { contratoController } = require('../controllers');

router.get('/', contratoController.getAll);
router.get('/:id', contratoController.getById);
router.post('/', contratoController.create);
router.put('/:id', contratoController.update);
router.delete('/:id', contratoController.delete);

module.exports = router;
