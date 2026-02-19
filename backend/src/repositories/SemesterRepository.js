const Database = require('../config/Database.js');

/** * Repository para gerenciar os semestres.
 * 
 * Cada semestre tem um label (ex: "2024.1") e um drive_root_id (ID da pasta no Google Drive).
 * Apenas um semestre pode estar ativo por vez.
 */
class SemesterRepository {
   
    async findByLabel(label) {
        const sql = `SELECT * FROM semesters WHERE label = ?`;
        const rows = await Database.query(sql, [label]);
        return rows[0];
    }

    /**
     * Cria um novo semestre e desativa os outros.
     * @param {Object} param0 
     * @param {string} param0.label - O label do semestre (ex: "2024.1")
     * @param {string} param0.drive_root_id - O ID da pasta raiz no Google Drive
     * @returns {Promise<number>} ID do semestre criado
     */
    async create({ label, drive_root_id }) {

        await Database.query(`UPDATE semesters SET is_active = 0`);

        const sql = `
            INSERT INTO semesters (label, drive_root_id, is_active)
            VALUES (?, ?, 1)
        `;
        const result = await Database.query(sql, [label, drive_root_id]);
        return result.insertId;
    }

    // Busca o semestre ativo
    async getActive() {
        const sql = `SELECT * FROM semesters WHERE is_active = 1 LIMIT 1`;
        const rows = await Database.query(sql);
        return rows[0];
    }
}

module.exports = new SemesterRepository();