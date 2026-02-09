const express = require('express');
const router = express.Router();
const SubmissionFolderController = require('../controllers/SubmissionFolderController');



router.get('/', SubmissionFolderController.index); 


module.exports = router;