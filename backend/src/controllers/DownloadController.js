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

            const folderInfo = await SubmissionFolderRepository.findById(folderId);
            const documents = await DocumentRepository.findAllByFolder(folderId);

            if (!folderInfo) return res.status(404).json({ error: 'Pacote não encontrado.' });
            if (!documents || documents.length === 0) return res.status(400).json({ error: 'Esta pasta está vazia.' });

            // Configura resposta
            const zipName = `${folderInfo.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
            res.attachment(zipName);

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => {
                console.error('Erro na compactação:', err);
                if (!res.headersSent) res.status(500).send({ error: 'Erro ao gerar ZIP.' });
            });

            archive.pipe(res);
            console.log(`📦 Gerando ZIP: ${zipName}`);

            for (const doc of documents) {
                try {
                
                    
                    // CASO 1: É UM LINK? (Verificamos pelo ID que definimos no Repository)
                    if (doc.drive_file_id === 'LINK_EXTERNO' || doc.mime_type === 'application/internet-shortcut') {
                        
                        // Conteúdo padrão de um arquivo .url do Windows
                        const shortcutContent = `[InternetShortcut]\r\nURL=${doc.drive_web_link}`;
                        
                        // Adiciona ao ZIP como uma string (Buffer)
                        archive.append(shortcutContent, { name: doc.original_name });
                        
                    } 
                    // CASO 2: É UM ARQUIVO DO DRIVE?
                    else {
                        const fileStream = await DriveService.getFileStream(doc.drive_file_id);
                        archive.append(fileStream, { name: doc.original_name });
                    }

                } catch (err) {
                    console.error(`⚠️ Erro no arquivo ${doc.original_name}:`, err.message);
                    archive.append(`Erro: ${err.message}`, { name: `ERRO_${doc.original_name}.txt` });
                }
            }

            await archive.finalize();
            console.log('✅ ZIP enviado.');

        } catch (error) {
            console.error('Erro fatal no download:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Erro interno.' });
        }
    }
}

module.exports = new DownloadController();