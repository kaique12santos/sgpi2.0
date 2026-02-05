const express = require('express');
const router = express.Router();
const SetupController = require('../controllers/SetupController');

// Rota mágica para rodar uma vez
router.post('/create-folders', SetupController.createSemesterFolders);

module.exports = router;