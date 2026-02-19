const Database = require('../config/Database');

/**
 * Controller para o dashboard do professor e coordenador.
 * 
 * O endpoint GET /dashboard/stats retorna estatísticas diferentes dependendo do papel do usuário:
 */
class DashboardController {

    /**
     * Retorna estatísticas para o dashboard do professor ou coordenador.
     * 1. Para coordenadores: total de pastas, espaço usado e total de usuários.
     * 2. Para professores: total de entregas e documentos pendentes.
     */
    async getStats(req, res) {
        try {
            const userId = req.userId; // ID do professor logado

            const [userRows] = await Database.query('SELECT role FROM users WHERE id = ?', [userId]);
            const userRole = userRows.role || 'professor';
            let stats = {};

            if (userRole === 'coordenador') {

                const [folders] = await Database.query(`SELECT COUNT(*) as total FROM submission_folders`);

                const [storage] = await Database.query(`SELECT SUM(size_bytes) as total FROM documents WHERE status = 'COMPLETED'`);

                const [users] = await Database.query(`SELECT COUNT(*) as total FROM users`);

                stats = {
                    totalFolders: folders.total,
                    totalStorage: storage.total,
                    totalUsers: users.total,
                };

            } else {

                const [submissions] = await Database.query(
                    `SELECT COUNT(*) as total FROM submission_folders WHERE user_id = ?`,
                    [userId]
                );

                const [pending] = await Database.query(
                    `SELECT COUNT(*) as total FROM documents WHERE status = 'PENDING' OR status = 'UPLOADING'`
                );

                stats = {
                    submissionsCount: submissions.total,
                    pendingCount: pending.total
                };

            }
            return res.json(stats);

        } catch (error) {
            console.error('Erro na Dashboard:', error);
            return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
        }
    }
}

module.exports = new DashboardController();