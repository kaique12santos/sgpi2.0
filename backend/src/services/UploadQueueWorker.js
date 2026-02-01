const fs = require('fs');
const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('./googleDriveService');

class UploadQueueWorker {
    constructor() {
        this.isProcessing = false;
    }

    /**
     * Inicia o processamento da fila.
     * Deve ser chamado sempre que um novo upload chega ou quando o servidor inicia.
     */
    async processQueue() {
        if (this.isProcessing) return; // Evita rodar dois uploads ao mesmo tempo
        this.isProcessing = true;
        
        let doc = null;
        try {
            console.log('🔄 [Worker] Verificando fila de uploads...');
            
            // 1. Pega o próximo item da fila
            doc = await DocumentRepository.findNextPending();

            if (!doc) {
                console.log('✅ [Worker] Fila vazia. Aguardando novos arquivos.');
                this.isProcessing = false;
                return;
            }

            console.log(`🚀 [Worker] Processando arquivo ID ${doc.id}: ${doc.original_name}`);

            // Atualiza para UPLOADING
            await DocumentRepository.updateStatus(doc.id, 'UPLOADING');

            // 2. Descobre a pasta do Drive onde deve salvar
            // Precisamos buscar o drive_folder_id da pasta pai (SubmissionFolder)
            const folderInfo = await SubmissionFolderRepository.findById(doc.folder_id);
            
            if (!folderInfo || !folderInfo.drive_folder_id) {
                throw new Error('Pasta de destino não encontrada no Drive.');
            }

            // 3. Realiza o Upload para o Google Drive
            const driveFile = await DriveService.uploadFile(
                doc.local_path,
                doc.original_name,
                doc.mime_type,
                folderInfo.drive_folder_id
            );

            // 4. Sucesso! Atualiza banco e deleta arquivo local
            await DocumentRepository.updateStatus(doc.id, 'COMPLETED', driveFile);
            
            // Remove o arquivo da pasta temporária 'uploads/'
            if (fs.existsSync(doc.local_path)) {
                fs.unlinkSync(doc.local_path);
            }

            console.log(`✨ [Worker] Upload concluído: ${doc.original_name}`);

            // Chama a si mesmo para processar o próximo imediatamente
            this.isProcessing = false;
            this.processQueue();

        } catch (error) {
            console.error(`❌ [Worker] Falha no upload doc ${doc?.id}:`, error.message);
            
            if (doc) {
                await DocumentRepository.updateStatus(doc.id, 'ERROR', { error: error.message });
            }
            
            this.isProcessing = false;
            // Tenta o próximo mesmo se este falhou
            this.processQueue();
        }
    }
}

module.exports = new UploadQueueWorker();