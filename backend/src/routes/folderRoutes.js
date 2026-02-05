const express = require('express');
const FolderController = require('../controllers/FolderController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();

// Todas as rotas abaixo exigem login
router.use(authMiddleware);

router.post('/create', FolderController.create);
router.get('/my-folders', FolderController.listMyFolders);


module.exports = router;