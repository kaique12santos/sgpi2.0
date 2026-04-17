const archiver = require('archiver');
const DocumentRepository = require('../repositories/DocumentRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DriveService = require('../services/googleDriveService');

class DownloadController {

    async downloadFolderAsZip(req, res) {
        try {
            const { folderId } = req.params;

            const folderInfo = await SubmissionFolderRepository.findById(folderId);
            const documents = await DocumentRepository.findAllByFolder(folderId);

            if (!folderInfo) return res.status(404).json({ error: 'Pacote não encontrado.' });

            // 1. FILTRO DE SEGURANÇA: Só baixa o que já terminou de subir com sucesso
            const validDocuments = documents.filter(doc => doc.status === 'COMPLETED');

            if (!validDocuments || validDocuments.length === 0) {
                return res.status(400).json({ error: 'Não há arquivos finalizados nesta pasta.' });
            }

            const zipName = `${folderInfo.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
            res.attachment(zipName);

            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => {
                console.error('Erro fatal na compactação do ZIP:', err);
                if (!res.headersSent) res.status(500).send({ error: 'Erro ao gerar ZIP.' });
                res.end(); // Força o encerramento se quebrar no meio
            });

            archive.pipe(res);
            console.log(`📦 Gerando ZIP: ${zipName} com ${validDocuments.length} arquivos.`);

            // 2. CONTROLE DE DUPLICATAS: Evita que o Archiver quebre com arquivos de nomes iguais
            const nameCounter = {};

            for (const doc of validDocuments) {
                try {
                    let fileName = doc.original_name;

                    if (nameCounter[fileName]) {
                        nameCounter[fileName]++;
                        const parts = fileName.split('.');
                        const ext = parts.length > 1 ? `.${parts.pop()}` : '';
                        fileName = `${parts.join('.')}_(${nameCounter[fileName]})${ext}`;
                    } else {
                        nameCounter[fileName] = 1;
                    }

                    if (doc.drive_file_id === 'LINK_EXTERNO' || doc.mime_type === 'application/internet-shortcut') {
                        const shortcutContent = `[InternetShortcut]\r\nURL=${doc.drive_web_link}`;
                        archive.append(shortcutContent, { name: fileName });
                    } else {
                        
                        const fileStream = await DriveService.getFileStream(doc.drive_file_id);
                        
                        // Captura erros individuais do stream para não explodir o ZIP inteiro
                        fileStream.on('error', (err) => {
                            console.error(`⚠️ Queda de conexão no arquivo ${fileName}:`, err.message);
                        });

                        archive.append(fileStream, { name: fileName });

                        // 3. A MÁGICA: Força o loop a esperar esse stream terminar ANTES de pedir o próximo!
                        // Isso impede que o Google Drive derrube as conexões por timeout.
                        await new Promise((resolve) => {
                            fileStream.on('end', resolve);
                            fileStream.on('error', resolve); 
                        });
                    }

                } catch (err) {
                    console.error(`⚠️ Erro crítico no arquivo ${doc.original_name}:`, err.message);
                    archive.append(`Falha ao baixar o arquivo do Drive: ${err.message}`, { name: `ERRO_${doc.original_name}.txt` });
                }
            }

            await archive.finalize();
            console.log('✅ ZIP finalizado e entregue ao usuário.');

        } catch (error) {
            console.error('Erro fatal no download:', error);
            if (!res.headersSent) res.status(500).json({ error: 'Erro interno.' });
            res.end();
        }
    }
}

module.exports = new DownloadController();