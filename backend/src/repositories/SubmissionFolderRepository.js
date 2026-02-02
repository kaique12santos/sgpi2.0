const Database = require('../config/Database.js');

class SubmissionFolderRepository {

    /**
     * Cria o registro de uma nova pasta de entrega no banco.
     */
    async create({ title, user_id, semester_id, discipline_id, drive_folder_id }) {
        const sql = `
            INSERT INTO submission_folders 
            (title, user_id, semester_id, discipline_id, drive_folder_id)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await Database.query(sql, [
            title, user_id, semester_id, discipline_id, drive_folder_id
        ]);
        return result.insertId;
    }

    /**
     * Lista as pastas de um professor específico.
     */
    async findByProfessor(userId) {
        const sql = `
            SELECT sf.*, d.name as discipline_name, s.label as semester_label
            FROM submission_folders sf
            JOIN disciplines d ON sf.discipline_id = d.id
            JOIN semesters s ON sf.semester_id = s.id
            WHERE sf.user_id = ?
            ORDER BY sf.created_at DESC
        `;
        return await Database.query(sql, [userId]);
    }

    /**
     * Busca pasta pelo ID (com info do dono).
     */
    async findById(id) {
        const sql = `SELECT * FROM submission_folders WHERE id = ?`;
        const rows = await Database.query(sql, [id]);
        return rows[0];
    }

    async delete(id) {
        // Primeiro deleta os documentos filhos (limpeza manual para garantir)
        await Database.query(`DELETE FROM documents WHERE folder_id = ?`, [id]);
        // Depois deleta a pasta
        const sql = `DELETE FROM submission_folders WHERE id = ?`;
        await Database.query(sql, [id]);
    }
}

module.exports = new SubmissionFolderRepository();