const express = require('express');
const DownloadController = require('../controllers/DownloadController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Rota: GET /api/downloads/folder/15
router.get('/folder/:folderId', DownloadController.downloadFolderAsZip);

module.exports = router;