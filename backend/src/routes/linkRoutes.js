const express = require('express');
const LinkController = require('../controllers/LinkController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.post('/add', LinkController.addLink);

module.exports = router;