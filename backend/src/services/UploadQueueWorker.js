const fs = require('fs');
const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('./googleDriveService');
const {sanitizeFilename} = require('../utils/stringUtils')

/**
 * UploadQueueWorker é responsável por processar a fila de uploads de forma sequencial.
 * Ele é acionado sempre que um novo upload é adicionado à fila ou quando o servidor inicia.
 * O worker pega o próximo item pendente, tenta fazer o upload para o Google Drive, e atualiza o status no banco.
 * Em caso de falha, ele marca o item como 'ERROR' e continua para o próximo, garantindo que a fila não trave.
 */
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
            
            doc = await DocumentRepository.findNextPending();
            
            if (!doc) {
                console.log('✅ [Worker] Fila vazia. Aguardando novos arquivos.');
                this.isProcessing = false;
                return;
            }

            console.log(`🚀 [Worker] Processando arquivo ID ${doc.id}: ${doc.original_name}`);

            await DocumentRepository.updateStatus(doc.id, 'UPLOADING');

            const folderInfo = await SubmissionFolderRepository.findById(doc.folder_id);
            
            if (!folderInfo || !folderInfo.drive_folder_id) {
                throw new Error('Pasta de destino não encontrada no Drive.');
            }

            const cleanName = sanitizeFilename(doc.original_name);
            const driveFile = await DriveService.uploadFile(
                doc.local_path,
                cleanName,
                doc.mime_type,
                folderInfo.drive_folder_id
            );
            console.log('📦 [Worker] Resposta do Drive:', driveFile);
            
            if (!driveFile.webViewLink && driveFile.id) {
                driveFile.webViewLink = `https://drive.google.com/file/d/${driveFile.id}/view?usp=drivesdk`;
            }
            
            if (!driveFile.webContentLink && driveFile.id) {
                driveFile.webContentLink = `https://drive.google.com/uc?id=${driveFile.id}&export=download`;
            }

            let extractedLink = null;

            if (doc.mime_type === 'text/html') {
                try {
                    console.log(`🔍 [Worker] Lendo HTML para extrair link...`);
                    const content = fs.readFileSync(doc.local_path, 'utf8');
                    
                    const scriptMatch = content.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
                    
                    const metaMatch = content.match(/url=(https?:\/\/[^"'\s>]+)/);

                    if (scriptMatch && scriptMatch[1]) {
                        extractedLink = scriptMatch[1];
                        console.log(`🔗 [Worker] Link extraído via Script: ${extractedLink}`);
                    } 
                    else if (metaMatch && metaMatch[1]) {
                        extractedLink = metaMatch[1];
                        console.log(`🔗 [Worker] Link extraído via Meta Tag: ${extractedLink}`);
                    } 
                    else {
                        console.warn('⚠️ [Worker] HTML lido, mas nenhum padrão de link reconhecido.');
                     
                        console.log('📄 Conteúdo parcial:', content.substring(0, 150)); 
                    }
                } catch (readError) {
                    console.error('❌ [Worker] Erro crítico ao ler arquivo HTML:', readError.message);
                }
            }

            const uploadData = {
                ...driveFile,
                externalLink: extractedLink 
            };

            await DocumentRepository.updateStatus(doc.id, 'COMPLETED', uploadData);
            
            if (fs.existsSync(doc.local_path)) {
                fs.unlinkSync(doc.local_path);
            }

            console.log(`✨ [Worker] Upload concluído: ${doc.original_name}`);

            this.isProcessing = false;
            this.processQueue();

        } catch (error) {
            console.error(`❌ [Worker] Falha no upload doc ${doc?.id}:`, error.message);
            
            if (doc) {
                await DocumentRepository.updateStatus(doc.id, 'ERROR', { error: error.message });
            }
            
            this.isProcessing = false;
            this.processQueue();
        }
    }
}

module.exports = new UploadQueueWorker();