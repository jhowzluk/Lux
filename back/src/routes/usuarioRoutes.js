const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/', usuarioController.getAllUsuarios);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);

module.exports = router;