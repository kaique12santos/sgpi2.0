const DocumentRepository = require('../repositories/DocumentRepository');
const UploadQueueWorker = require('../services/UploadQueueWorker');

class UploadController {

    /**
     * Recebe os arquivos do Multer e enfileira para processamento.
     */
    async uploadFiles(req, res) {
        try {
            const { folderId } = req.body;
            const files = req.files; // Array de arquivos vindo do Multer

            if (!files || files.length === 0) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            }

            if (!folderId) {
                return res.status(400).json({ error: 'ID da pasta do pacote é obrigatório.' });
            }

            const savedDocs = [];

            // 1. Salva cada arquivo no banco com status PENDING
            for (const file of files) {
                const docId = await DocumentRepository.create({
                    folder_id: folderId,
                    original_name: file.originalname,
                    local_path: file.path, // Caminho na pasta uploads/
                    mime_type: file.mimetype,
                    size_bytes: file.size
                });
                
                savedDocs.push({ id: docId, name: file.originalname, status: 'PENDING' });
            }

            // 2. Acorda o Worker para começar a trabalhar
            // Não usamos 'await' aqui propositalmente para não travar a resposta do usuário
            UploadQueueWorker.processQueue();

            // 3. Responde rápido para o usuário
            return res.status(201).json({
                success: true,
                message: `${files.length} arquivos colocados na fila de upload.`,
                documents: savedDocs
            });

        } catch (error) {
            console.error('Erro no controller de upload:', error);
            return res.status(500).json({ error: 'Erro ao processar uploads.' });
        }
    }
}

module.exports = new UploadController();