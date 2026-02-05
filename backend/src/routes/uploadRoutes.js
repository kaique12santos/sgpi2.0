const express = require('express');
const UploadController = require('../controllers/UploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadConfig = require('../config/multerConfig');

const router = express.Router();

router.use(authMiddleware);

// Aceita múltiplos arquivos (campo 'files' no form-data, max 10 por vez)
router.post('/', uploadConfig.array('files', 10), UploadController.uploadFiles);


module.exports = router;