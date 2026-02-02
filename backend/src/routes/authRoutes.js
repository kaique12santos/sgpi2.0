const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Definição das rotas públicas
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/verify', AuthController.verifyEmail);

module.exports = router;