const Database = require('../config/Database.js');

/**
 * Controller para gerenciar metadados do sistema, como disciplinas e semestres.
 */
class MetadataController {

    /**
     * Retorna a lista de todas as disciplinas cadastradas.
     * Usado para popular o <select> no Frontend.
     */
    async listDisciplines(req, res) {
        try {
            const sql = 'SELECT id, name, course_level FROM disciplines ORDER BY course_level, name';
            const rows = await Database.query(sql);
            res.json({ success: true, disciplines: rows });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
        }
    }

    /**
     * Retorna o semestre que está ativo no momento (ex: 2025_1).
     */
    async getActiveSemester(req, res) {
        try {
            const sql = 'SELECT id, label FROM semesters WHERE is_active = 1 LIMIT 1';
            const rows = await Database.query(sql);
            if (rows.length > 0) {
                res.json({ success: true, semester: rows[0] });
            } else {
                res.status(404).json({ error: 'Nenhum semestre ativo.' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar semestre ativo.' });
        }
    }
}

module.exports = new MetadataController();