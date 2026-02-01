const Database = require('../config/Database');

class DocumentRepository {
    
    // Cria o registro inicial (Estado PENDING)
    async create({ folder_id, original_name, local_path, mime_type, size_bytes }) {
        const sql = `
            INSERT INTO documents 
            (folder_id, original_name, local_path, mime_type, size_bytes, status, drive_file_id)
            VALUES (?, ?, ?, ?, ?, 'PENDING', 'temp_pending')
        `;
        // drive_file_id é obrigatório no banco, colocamos um temporário até subir
        const result = await Database.query(sql, [
            folder_id, original_name, local_path, mime_type, size_bytes
        ]);
        return result.insertId;
    }

    // Busca o próximo arquivo da fila que precisa ser processado
    async findNextPending() {
        // Pega um arquivo PENDENTE ou com ERRO (se tentou menos de 3 vezes)
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

    // Atualiza o status (Ex: de PENDING para COMPLETED)
   // Atualiza o status (Ex: de PENDING para COMPLETED)
    async updateStatus(id, status, driveData = {}) {
        let sql = `UPDATE documents SET status = ?`;
        const params = [status];

        // Se tiver ID do Drive, atualiza os campos
        // Verificação reforçada: checa se driveData e driveData.id existem
        if (driveData && (driveData.id || driveData.drive_file_id)) {
            // O Google retorna 'id', mas nossa tabela usa 'drive_file_id'
            // Vamos garantir que pegamos o ID certo independente de como venha
            const realDriveId = driveData.id || driveData.drive_file_id;
            
            sql += `, drive_file_id = ?, drive_web_link = ?, drive_download_link = ?`;
            params.push(realDriveId, driveData.webViewLink, driveData.webContentLink);
        }

        if (driveData.error) {
            sql += `, error_log = ?, retry_count = retry_count + 1`;
            params.push(driveData.error);
        }

        // Se completou, limpamos o caminho local
        if (status === 'COMPLETED') {
            sql += `, local_path = NULL`;
        }

        sql += ` WHERE id = ?`;
        params.push(id);

        await Database.query(sql, params);
    }

    /**
     * Busca todos os documentos finalizados de uma pasta específica.
     */
    async findAllByFolder(folderId) {
        const sql = `
            SELECT * FROM documents 
            WHERE folder_id = ? AND status = 'COMPLETED'
        `;
        return await Database.query(sql, [folderId]);
    }
}

module.exports = new DocumentRepository();