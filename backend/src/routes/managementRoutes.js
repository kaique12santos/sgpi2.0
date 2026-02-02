const express = require('express');
const ManagementController = require('../controllers/ManagementController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Rota: DELETE /api/management/documents/45
router.delete('/documents/:id', ManagementController.deleteDocument);
router.delete('/folders/:id', ManagementController.deleteFolder);

module.exports = router;