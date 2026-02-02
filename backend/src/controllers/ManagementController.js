const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('../services/googleDriveService');
const fs = require('fs');

class ManagementController {

    /**
     * Deleta um documento ou link.
     * Regra de Ouro: Só o dono da pasta (Professor) ou o Coordenador podem deletar.
     */
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const userRole = req.userRole;

            // 1. Busca o documento
            const doc = await DocumentRepository.findById(id);
            if (!doc) {
                return res.status(404).json({ error: 'Documento não encontrado.' });
            }

            // 2. Busca a pasta para saber quem é o dono
            const folder = await SubmissionFolderRepository.findById(doc.folder_id);
            
            // 3. Verifica Permissão
            // Se não for Coordenador E não for o dono da pasta... TCHAU!
            if (userRole !== 'coordenador' && folder.user_id !== userId) {
                return res.status(403).json({ error: 'Você não tem permissão para deletar este arquivo.' });
            }

            // 4. Se for arquivo do Drive, deleta lá
            if (doc.drive_file_id && doc.drive_file_id !== 'LINK_EXTERNO' && doc.drive_file_id !== 'temp_pending') {
                await DriveService.deleteFile(doc.drive_file_id);
            }

            // 5. Se for arquivo local (que travou no upload), apaga do disco
            if (doc.local_path && fs.existsSync(doc.local_path)) {
                fs.unlinkSync(doc.local_path);
            }

            // 6. Remove do Banco
            await DocumentRepository.delete(id);

            return res.json({ success: true, message: 'Documento removido com sucesso.' });

        } catch (error) {
            console.error('Erro ao deletar:', error);
            return res.status(500).json({ error: 'Erro interno ao deletar documento.' });
        }
    }
}

module.exports = new ManagementController();