const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('../services/googleDriveService');
const fs = require('fs');


/** * Controller para gerenciar ações de exclusão (Documentos e Pastas).
 * 
 * O endpoint DELETE /management/document/:id deleta um documento (arquivo ou link).
 * O endpoint DELETE /management/folder/:id deleta uma pasta inteira (Pacote de Entrega) seguindo regras específicas.
 */
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

            const doc = await DocumentRepository.findById(id);
            if (!doc) {
                return res.status(404).json({ error: 'Documento não encontrado.' });
            }

            const folder = await SubmissionFolderRepository.findById(doc.folder_id);

            if (userRole !== 'coordenador' && folder.user_id !== userId) {
                return res.status(403).json({ error: 'Você não tem permissão para deletar este arquivo.' });
            }

            if (doc.drive_file_id && doc.drive_file_id !== 'LINK_EXTERNO' && doc.drive_file_id !== 'temp_pending') {
                await DriveService.deleteFile(doc.drive_file_id);
            }

            if (doc.local_path && fs.existsSync(doc.local_path)) {
                fs.unlinkSync(doc.local_path);
            }

            await DocumentRepository.delete(id);

            return res.json({ success: true, message: 'Documento removido com sucesso.' });

        } catch (error) {
            console.error('Erro ao deletar:', error);
            return res.status(500).json({ error: 'Erro interno ao deletar documento.' });
        }
    }

    /**
     * Deleta uma PASTA inteira (Pacote de Entrega).
     * REGRA DE NEGÓCIO: Só permite se tiver mais de 5 anos (Legislação DSM)
     * OU se a pasta estiver vazia (criada por engano).
     */
    async deleteFolder(req, res) {
        try {
            const { id } = req.params;
            const userRole = req.userRole;
            const folder = await SubmissionFolderRepository.findById(id);
            if (!folder) {
                return res.status(404).json({ error: 'Pasta não encontrada.' });
            }


            if (userRole !== 'coordenador') {
                return res.status(403).json({ error: 'Apenas coordenadores podem excluir pastas inteiras.' });
            }


            const dataCriacao = new Date(folder.created_at);
            const dataAtual = new Date();

            // Diferença em milissegundos
            const diffTempo = Math.abs(dataAtual - dataCriacao);
            // Converte para anos (ms -> s -> min -> h -> dia -> ano)
            const diffAnos = diffTempo / (1000 * 60 * 60 * 24 * 365.25);

            if (diffAnos < 5) {

                const qtdArquivos = await DocumentRepository.countByFolder(id);

                if (qtdArquivos > 0) {
                    return res.status(400).json({
                        error: `BLOQUEIO LEGAL: Esta entrega tem ${diffAnos.toFixed(1)} anos. A legislação exige guarda por 5 anos. Apague apenas os arquivos errados individualmente.`
                    });
                }
            }


            if (folder.google_drive_id) {
                await DriveService.deleteFile(folder.google_drive_id);
            }

            await SubmissionFolderRepository.delete(id);

            return res.json({ success: true, message: 'Pasta removida com sucesso.' });

        } catch (error) {
            console.error('Erro ao deletar pasta:', error);
            return res.status(500).json({ error: 'Erro interno ao deletar pasta.' });
        }
    }
}

module.exports = new ManagementController();