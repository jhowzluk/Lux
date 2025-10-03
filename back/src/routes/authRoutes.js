const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de Login
router.post('/login', authController.login);

// Rota de Recuperação de Senha (Exemplo)
router.post('/recuperar-senha', authController.recoverPassword);

module.exports = router;