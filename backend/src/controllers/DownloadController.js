const archiver = require('archiver');
const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('../services/googleDriveService');

class DownloadController {

    /**
     * Gera um ZIP com todos os arquivos de um Pacote de Entrega.
     * O ZIP é gerado em tempo real (Streaming) para não lotar a memória do servidor.
     */
    async downloadFolderAsZip(req, res) {
        try {
            const { folderId } = req.params;

            // 1. Busca informações do Pacote e dos Arquivos
            const folderInfo = await SubmissionFolderRepository.findById(folderId);
            const documents = await DocumentRepository.findAllByFolder(folderId);

            if (!folderInfo) {
                return res.status(404).json({ error: 'Pacote não encontrado.' });
            }

            if (!documents || documents.length === 0) {
                return res.status(400).json({ error: 'Esta pasta está vazia.' });
            }

            // 2. Configura o Cabeçalho da Resposta (Diz pro navegador: "É um download!")
            const zipName = `${folderInfo.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
            res.attachment(zipName);

            // 3. Inicializa o Arquivador (ZIP)
            const archive = archiver('zip', {
                zlib: { level: 9 } // Nível máximo de compressão
            });

            // Se der erro no ZIP, avisa o servidor, mas a resposta já começou a ir pro usuário
            archive.on('error', (err) => {
                console.error('Erro na compactação:', err);
                if (!res.headersSent) res.status(500).send({ error: 'Erro ao gerar ZIP.' });
            });

            // Conecta o tubo do ZIP na resposta HTTP
            archive.pipe(res);

            console.log(`📦 Iniciando download ZIP: ${zipName} (${documents.length} arquivos)`);

            // 4. Itera sobre os arquivos e adiciona ao ZIP
            for (const doc of documents) {
                try {
                    // Pega o stream direto do Google Drive
                    const fileStream = await DriveService.getFileStream(doc.drive_file_id);
                    
                    // Adiciona ao ZIP com o nome original
                    archive.append(fileStream, { name: doc.original_name });
                
                } catch (err) {
                    console.error(`⚠️ Falha ao adicionar arquivo ${doc.original_name} ao ZIP:`, err.message);
                    // Opcional: Adicionar um arquivo de texto de erro dentro do ZIP
                    archive.append(`Erro ao baixar: ${err.message}`, { name: `ERRO_${doc.original_name}.txt` });
                }
            }

            // 5. Finaliza o ZIP (Isso encerra a resposta HTTP automaticamente)
            await archive.finalize();
            console.log('✅ Download ZIP finalizado com sucesso.');

        } catch (error) {
            console.error('Erro fatal no download:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Erro interno ao processar download.' });
        }
    }
}

module.exports = new DownloadController();