const express = require('express');
const router = express.Router();
const SystemController = require('../controllers/SystemController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Todos podem ver
router.get('/notice', SystemController.getMessage);

// Só coordenador pode editar (adicione verificação de role aqui se tiver middleware específico, ou confie no front por enquanto)
router.put('/notice', SystemController.updateMessage);

module.exports = router;