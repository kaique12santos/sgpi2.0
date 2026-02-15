const Database = require('../config/Database');

/**
 * Repositório para gerenciar documentos enviados pelos professores.
 * Focado em criação, leitura e atualização de status.
 */
class DocumentRepository {
    
    /**
     * Cria um novo registro de documento. 
     * O campo 'title' foi removido, pois agora usamos 'original_name'
     *  para armazenar o nome do arquivo enviado.
     * @returns {Promise<number>} ID do documento criado.
     */
    async create({ folder_id, original_name, local_path, mime_type, size_bytes }) {
        
        // 1. A query não tem mais o campo 'title'
        // 2. Mantivemos a SUBQUERY para converter o ID do Drive (String) no ID da Pasta (Int)
        const sql = `
            INSERT INTO documents 
            (
                folder_id, 
                original_name, 
                local_path, 
                mime_type, 
                size_bytes, 
                status, 
                drive_file_id
            )
            VALUES (
                (SELECT id FROM submission_folders WHERE drive_folder_id = ? LIMIT 1), 
                ?, ?, ?, ?, 'PENDING', 'temp_pending'
            )
        `;
        
        const result = await Database.query(sql, [
            folder_id,      // O ID do Drive que vem do Front (vai para a subquery)
            original_name,  // Nome do arquivo (ex: projeto.pdf)
            local_path, 
            mime_type, 
            size_bytes
        ]);

        return result.insertId;
    }

    /**
     * Encontra o próximo documento pendente para processamento.
     * @returns {Promise<Object>} O documento pendente mais antigo.
     */
    async findNextPending() {
        const sql = `
            SELECT * FROM documents 
            WHERE status = 'PENDING' 
            OR (status = 'ERROR' AND retry_count < 3)
            ORDER BY uploaded_at ASC 
            LIMIT 1
        `;
        const rows = await Database.query(sql);
        return rows[0];
    }

    /**
     *  Atualiza o status de um documento, e opcionalmente os dados do Drive.
     * @param {number} id do documento a ser atualizado
     * @param {string} status (NOVO STATUS: 'COMPLETED', 'PENDING', etc.) 
     * @param {Object} driveData (Dados opcionais do Drive: { id, webViewLink, webContentLink, externalLink, error })
     */
    async updateStatus(id, status, driveData = {}) {
        console.log('CHAMOU REPO:', driveData);
        let sql = `UPDATE documents SET status = ?`;
        const params = [status];

        // Debug: Vamos ver o que chega no Repositório
        if (driveData.externalLink) {
            console.log(`💾 [Repo] Salvando external_link no banco: ${driveData.externalLink}`);
        }

        // Se tiver ID do Drive, atualiza os campos
        if (driveData && (driveData.id || driveData.drive_file_id)) {
            const realDriveId = driveData.id || driveData.drive_file_id;
            
            // USE O NOME EXATO DAS COLUNAS DO SEU BANCO
            sql += `, drive_file_id = ?, drive_web_link = ?, drive_download_link = ?`;
            params.push(realDriveId, driveData.webViewLink, driveData.webContentLink);
        }

        if (driveData.externalLink) {
            sql += `, external_link = ?`; 
            params.push(driveData.externalLink);
        }

        if (driveData.error) {
            sql += `, error_log = ?, retry_count = retry_count + 1`;
            params.push(driveData.error);
        }

        if (status === 'COMPLETED') {
            sql += `, local_path = NULL`;
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        await Database.query(sql, params);
    }

    /**
     * Cria um link externo como documento, associando à pasta correta.
     * @param {Object} param Objeto com folder_id, url e original_name (nome do link)
     * @returns {Promise<number>} ID do documento criado.
     */
    async createLink({ folder_id, url, original_name }) { // Trocamos title por original_name
        const sql = `
            INSERT INTO documents 
            (folder_id, original_name, drive_web_link, mime_type, status, drive_file_id, size_bytes)
            VALUES (
                (SELECT id FROM submission_folders WHERE drive_folder_id = ? LIMIT 1), 
                ?, ?, 'application/internet-shortcut', 'COMPLETED', 'LINK_EXTERNO', 0
            )
        `;
        const result = await Database.query(sql, [
            folder_id, original_name || 'Link Externo', url
        ]);
        return result.insertId;
    }

    // --- MÉTODOS DE LEITURA ---
    async findAllByFolder(folderId) {
        const sql = `SELECT * FROM documents WHERE folder_id = ? AND status = 'COMPLETED'`;
        return await Database.query(sql, [folderId]);
    }

    async findById(id) {
        const sql = `SELECT * FROM documents WHERE id = ?`;
        const rows = await Database.query(sql, [id]);
        return rows[0];
    }

    // --- MÉTODO DE EXCLUSÃO (CASO QUEIRA IMPLEMENTAR) ---
    async delete(id) {
        const sql = `DELETE FROM documents WHERE id = ?`;
        await Database.query(sql, [id]);
    }

    /**
     * Conta quantos arquivos existem em uma pasta (para validação de exclusão).
     */
    async countByFolder(folderId) {
        const sql = `SELECT COUNT(*) as total FROM documents WHERE folder_id = ?`;
        const [rows] = await Database.query(sql, [folderId]);
        return rows.total || 0;
    }
}

module.exports = new DocumentRepository();