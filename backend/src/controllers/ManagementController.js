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

    /**
     * Deleta uma PASTA inteira (Pacote de Entrega).
     * REGRA DE NEGÓCIO: Só permite se tiver mais de 5 anos (Legislação DSM)
     * OU se a pasta estiver vazia (criada por engano).
     */
    async deleteFolder(req, res) {
        try {
            const { id } = req.params;
            const userRole = req.userRole; // Vem do AuthMiddleware

            // 1. Busca a pasta
            const folder = await SubmissionFolderRepository.findById(id);
            if (!folder) {
                return res.status(404).json({ error: 'Pasta não encontrada.' });
            }

            // 2. Verifica se é Coordenador (Só coord pode apagar pasta de aluno)
            if (userRole !== 'coordenador') {
                return res.status(403).json({ error: 'Apenas coordenadores podem excluir pastas inteiras.' });
            }

            // 3. REGRA DOS 5 ANOS (Cálculo de Data)
            const dataCriacao = new Date(folder.created_at);
            const dataAtual = new Date();
            
            // Diferença em milissegundos
            const diffTempo = Math.abs(dataAtual - dataCriacao);
            // Converte para anos (ms -> s -> min -> h -> dia -> ano)
            const diffAnos = diffTempo / (1000 * 60 * 60 * 24 * 365.25);

            // Se tem MENOS de 5 anos...
            if (diffAnos < 5) {
                // ...Só permite apagar se a pasta estiver VAZIA (sem arquivos vinculados)
                // Vamos precisar de um método no Repository para contar arquivos
                const qtdArquivos = await DocumentRepository.countByFolder(id);

                if (qtdArquivos > 0) {
                    return res.status(400).json({ 
                        error: `BLOQUEIO LEGAL: Esta entrega tem ${diffAnos.toFixed(1)} anos. A legislação exige guarda por 5 anos. Apague apenas os arquivos errados individualmente.` 
                    });
                }
            }

            // 4. Se passou na regra (ou é velha, ou está vazia), executa exclusão
            // Precisamos deletar no Drive também (se tiver ID)
            if (folder.google_drive_id) {
                await DriveService.deleteFile(folder.google_drive_id);
            }

            // Remove do banco (Isso deve deletar os documents em cascata se configurado, 
            // ou devemos deletar os documents antes manualmente)
            await SubmissionFolderRepository.delete(id);

            return res.json({ success: true, message: 'Pasta removida com sucesso.' });

        } catch (error) {
            console.error('Erro ao deletar pasta:', error);
            return res.status(500).json({ error: 'Erro interno ao deletar pasta.' });
        }
    }
}

module.exports = new ManagementController();