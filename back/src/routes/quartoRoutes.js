const express = require('express');
const router = express.Router();
const quartoController = require('../controllers/quartoController');

router.get('/disponiveis', quartoController.getQuartosDisponiveis);
router.get('/', quartoController.getAllQuartos);
router.post('/', quartoController.createQuarto);
router.put('/:id', quartoController.updateQuarto);
router.delete('/:id', quartoController.deleteQuarto);

module.exports = router;