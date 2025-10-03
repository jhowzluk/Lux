const express = require('express');
const router = express.Router();
const quartoController = require('../controllers/quartoController');

router.get('/', quartoController.getAllQuartos);

module.exports = router;