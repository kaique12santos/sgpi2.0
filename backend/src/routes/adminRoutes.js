const express = require('express');
const AdminUserController = require('../controllers/AdminUserController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();
router.use(authMiddleware);


router.get('/users', AdminUserController.index);
router.put('/users/:id', AdminUserController.update);
router.delete('/users/:id', AdminUserController.delete);

module.exports = router;