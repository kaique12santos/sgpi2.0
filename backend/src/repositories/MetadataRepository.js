const Database = require('../config/Database.js');

/**
 * Repositório para buscar metadados do sistema (Semestres, Disciplinas).
 * Focado em leitura.
 */
class MetadataRepository {

    /**
     * Busca o semestre ativo.
     * @returns {Promise<Object>} Dados do semestre ativo.
     */
    async findActiveSemester() {
        const sql = `SELECT * FROM semesters WHERE is_active = 1 LIMIT 1`;
        const rows = await Database.query(sql);
        return rows[0];
    }

    /**
     * Busca uma disciplina pelo ID.
     * @param {number} id 
     */
    async findDisciplineById(id) {
        const sql = `SELECT * FROM disciplines WHERE id = ?`;
        const rows = await Database.query(sql, [id]);
        return rows[0];
    }
}

module.exports = new MetadataRepository();