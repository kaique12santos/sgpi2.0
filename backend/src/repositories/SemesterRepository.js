const Database = require('../config/Database.js');

class SemesterRepository {
    
    async findByLabel(label) {
        const sql = `SELECT * FROM semesters WHERE label = ?`;
        const rows = await Database.query(sql, [label]);
        return rows[0];
    }

    async create({ label, drive_root_id }) {
        // 1. Desativa todos os outros antes de criar o novo
        await Database.query(`UPDATE semesters SET is_active = 0`);

        // 2. Cria o novo já como ativo
        const sql = `
            INSERT INTO semesters (label, drive_root_id, is_active)
            VALUES (?, ?, 1)
        `;
        const result = await Database.query(sql, [label, drive_root_id]);
        return result.insertId;
    }

    async getActive() {
        const sql = `SELECT * FROM semesters WHERE is_active = 1 LIMIT 1`;
        const rows = await Database.query(sql);
        return rows[0];
    }
}

module.exports = new SemesterRepository();