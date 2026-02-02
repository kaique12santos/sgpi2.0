const express = require('express');
const MetadataController = require('../controllers/MetadataController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Precisa estar logado para ver as disciplinas? Geralmente sim.
router.use(authMiddleware);

router.get('/disciplines', MetadataController.listDisciplines);
router.get('/semester', MetadataController.getActiveSemester);

module.exports = router;