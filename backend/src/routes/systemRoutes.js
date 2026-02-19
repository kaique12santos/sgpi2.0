const express = require('express');
const router = express.Router();
const SystemController = require('../controllers/SystemController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/notice', SystemController.getMessage);

router.put('/notice', SystemController.updateMessage);

module.exports = router;