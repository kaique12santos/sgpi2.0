const express = require('express');
const DashboardController = require('../controllers/DashboardController');
const authMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();
router.use(authMiddleware);


router.get('/stats', DashboardController.getStats);

module.exports = router;
