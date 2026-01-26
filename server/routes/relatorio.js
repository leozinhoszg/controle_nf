const express = require('express');
const router = express.Router();
const { relatorioController } = require('../controllers');

router.get('/tabela', relatorioController.getTabela);
router.get('/resumo', relatorioController.getResumo);
router.post('/seed', relatorioController.seed);

module.exports = router;
