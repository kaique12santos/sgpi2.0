const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

require('dotenv').config();

/**
 * Serviço para interagir com o Google Drive usando a API oficial.
 * Responsável por criar pastas, fazer upload de arquivos, deletar arquivos, etc.
 * Utiliza OAuth2 para autenticação e suporta refresh automático do token.
 */
class DriveService {
    constructor() {

        if (!process.env.GOOGLE_CLIENT_ID) throw new Error('❌ ERRO .ENV: GOOGLE_CLIENT_ID não encontrado.');
        if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('❌ ERRO .ENV: GOOGLE_CLIENT_SECRET não encontrado.');
        if (!process.env.GOOGLE_REFRESH_TOKEN) throw new Error('❌ ERRO .ENV: GOOGLE_REFRESH_TOKEN não encontrado.');

        console.log('🔑 Iniciando Serviço do Google Drive...');
        
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({ 
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN 
        });

        this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        console.log('✅ Google Drive Service autenticado com sucesso.');
    }

    /**
     * Cria uma pasta no Google Drive.
     * @param {string} folderName - Nome da pasta.
     * @param {string} parentId - ID da pasta pai (opcional).
     */
    async createFolder(folderName, parentId = null) {
        try {
            // Verifica se a pasta já existe para não duplicar
            const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false ${parentId ? `and '${parentId}' in parents` : ''}`;
            const existing = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, webViewLink)',
                spaces: 'drive',
            });

            if (existing.data.files.length > 0) {
                console.log(`📂 Pasta existente encontrada: ${folderName}`);
                return existing.data.files[0];
            }

            // Se não existe, cria
            const fileMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : [],
            };

            const file = await this.drive.files.create({
                resource: fileMetadata,
                fields: 'id, name, webViewLink',
            });
            
            console.log(`✨ Nova pasta criada: ${folderName} (ID: ${file.data.id})`);
            return file.data;

        } catch (error) {
            console.error(`❌ Erro ao criar pasta '${folderName}':`, error.message);
            throw error;
        }
    }

    /**
     * Faz upload de um arquivo para uma pasta específica.
     */
    async uploadFile(filePath, fileName, mimeType, folderId) {
        try {
            const fileMetadata = { name: fileName, parents: [folderId] };
            const media = { mimeType: mimeType, body: fs.createReadStream(filePath) };

            const file = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink, webContentLink',
            });
            return file.data;
        } catch (error) {
            console.error('❌ Erro no upload:', error.message);
            throw error;
        }
    }

    /**
     * Deleta (ou move para a lixeira) um arquivo ou pasta no Google Drive.
     */
    async deleteFile(fileId) {
        try {
            await this.drive.files.update({
                fileId: fileId,
                resource: { trashed: true } // Move para a lixeira ao invés de deletar permanentemente
            });

            console.log(`🗑️ Arquivo ${fileId} movido para a lixeira do Drive.`);
        } catch (error) {
            console.error(`❌ Erro ao deletar arquivo ${fileId}:`, error.message);
        }
    }

    /**
     * Obtém o stream de leitura de um arquivo (para download/zip).
     * @param {string} fileId - ID do arquivo no Drive.
     * @returns {Promise<Stream>} Stream do arquivo.
     */
    async getFileStream(fileId) {
        try {
            const response = await this.drive.files.get(
                { fileId: fileId, alt: 'media', acknowledgeAbuse: true },
                { responseType: 'stream' }
            );
            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao obter stream do arquivo ${fileId}:`, error.message);
            throw error;
        }
    }

    /**
     * Renomeia um arquivo ou pasta no Drive.
     * @param {string} fileId - ID do arquivo/pasta no Drive.
     * @param {string} newName - Novo nome.
     */
    async renameFile(fileId, newName) {
        try {
            await this.drive.files.update({
                fileId: fileId,
                resource: { name: newName }
            });
            console.log(`✏️ Arquivo ${fileId} renomeado para "${newName}"`);
        } catch (error) {
            console.error(`❌ Erro ao renomear arquivo ${fileId}:`, error.message);
            throw error;
        }
    }
}

module.exports = new DriveService();