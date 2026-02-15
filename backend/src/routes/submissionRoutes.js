const express = require('express');
const router = express.Router();
const SubmissionFolderController = require('../controllers/SubmissionFolderController');
const authMiddleware = require('../middlewares/authMiddleware.js');


router.use(authMiddleware); 
router.get('/', SubmissionFolderController.index); 
router.get('/painel', SubmissionFolderController.getAllFolders);


module.exports = router;