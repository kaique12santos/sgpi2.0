const express = require('express');
const FolderController = require('../controllers/FolderController.js');
const authMiddleware = require('../middlewares/authMiddleware.js');

const router = express.Router();

// Todas as rotas abaixo exigem login
router.use(authMiddleware);

// --- Rotas Comuns (Professor e Coordenador) ---
router.post('/create', FolderController.create);
router.get('/my-folders', FolderController.listMyFolders); // Professor vê só as dele
router.put('/:id', FolderController.update);   // Editar
router.delete('/:id', FolderController.delete); // Excluir
// --- Rotas Administrativas (Só Coordenador) ---
// Idealmente, crie um middleware 'adminMiddleware' para checar a role
router.get('/all', FolderController.listAll);

module.exports = router;