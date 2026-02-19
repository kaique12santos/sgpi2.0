const express = require('express');
const router = express.Router();
const SetupController = require('../controllers/SetupController');

router.post('/create-folders', SetupController.createSemesterFolders);

module.exports = router;