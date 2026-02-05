const Database = require('../config/Database');

class DocumentRepository {
    
    // --- MÉTODO CORRIGIDO (SEM TITLE, MAS COM A CONVERSÃO DE ID) ---
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

    // --- MÉTODOS DA FILA (MANTIDOS) ---

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

    async updateStatus(id, status, driveData = {}) {
        let sql = `UPDATE documents SET status = ?`;
        const params = [status];

        // Se tiver ID do Drive, atualiza os campos
        if (driveData && (driveData.id || driveData.drive_file_id)) {
            const realDriveId = driveData.id || driveData.drive_file_id;
            
            // Note que aqui usamos os nomes exatos do seu CREATE TABLE
            sql += `, drive_file_id = ?, drive_web_link = ?, drive_download_link = ?`;
            params.push(realDriveId, driveData.webViewLink, driveData.webContentLink);
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

    // Criação de Link Externo (Sem title também, para não quebrar)
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

    async findAllByFolder(folderId) {
        const sql = `SELECT * FROM documents WHERE folder_id = ? AND status = 'COMPLETED'`;
        return await Database.query(sql, [folderId]);
    }

    async findById(id) {
        const sql = `SELECT * FROM documents WHERE id = ?`;
        const rows = await Database.query(sql, [id]);
        return rows[0];
    }

    async delete(id) {
        const sql = `DELETE FROM documents WHERE id = ?`;
        await Database.query(sql, [id]);
    }
}

module.exports = new DocumentRepository();