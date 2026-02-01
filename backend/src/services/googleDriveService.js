const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

// 1. FORÇA O CARREGAMENTO DO .ENV IMEDIATAMENTE
require('dotenv').config();

class DriveService {
    constructor() {
        // 2. VERIFICAÇÃO DE SEGURANÇA (Debug)
        // Se alguma variável estiver faltando, ele avisa e para o servidor agora.
        if (!process.env.GOOGLE_CLIENT_ID) throw new Error('❌ ERRO .ENV: GOOGLE_CLIENT_ID não encontrado.');
        if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('❌ ERRO .ENV: GOOGLE_CLIENT_SECRET não encontrado.');
        if (!process.env.GOOGLE_REFRESH_TOKEN) throw new Error('❌ ERRO .ENV: GOOGLE_REFRESH_TOKEN não encontrado.');

        console.log('🔑 Iniciando Serviço do Google Drive...');
        
        // 3. Configuração da Autenticação
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        // Define as credenciais (Aqui é onde estava dando erro antes)
        this.oauth2Client.setCredentials({ 
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN 
        });

        // Inicializa o cliente do Drive
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
            // Verifica se a pasta já existe para não duplicar (Opcional, mas recomendado)
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
}

// Exporta uma instância única (Singleton) já inicializada
module.exports = new DriveService();