const Database = require('../config/Database');

/**
 * Controller para o dashboard do professor e coordenador.
 */
class DashboardController {

    async getStats(req, res) {
        try {
            const userId = req.userId; 

            const [userRows] = await Database.query('SELECT role FROM users WHERE id = ?', [userId]);
            const userRole = userRows.role || 'professor';
            let stats = {};

            const activeSemesterQuery = `(SELECT id FROM semesters WHERE is_active = 1 LIMIT 1)`;

            if (userRole === 'coordenador') {

                const [folders] = await Database.query(
                    `SELECT COUNT(*) as total FROM submission_folders WHERE semester_id = ${activeSemesterQuery}`
                );

               const [storage] = await Database.query(
                    `SELECT COALESCE(SUM(d.size_bytes), 0) as total 
                     FROM documents d
                     JOIN submission_folders sf ON d.folder_id = sf.id
                     WHERE d.status = 'COMPLETED' AND sf.semester_id = ${activeSemesterQuery}`
                );

                const [users] = await Database.query(`SELECT COUNT(*) as total FROM users`);

                stats = {
                    totalFolders: folders.total,
                    totalStorage: storage.total,
                    totalUsers: users.total,
                };

            } else {

                const [submissions] = await Database.query(
                    `SELECT COUNT(*) as total 
                     FROM submission_folders 
                     WHERE user_id = ? AND semester_id = ${activeSemesterQuery}`,
                    [userId]
                );

                const [pending] = await Database.query(
                    `SELECT COUNT(*) as total 
                     FROM documents d
                     JOIN submission_folders sf ON d.folder_id = sf.id
                     WHERE (d.status = 'PENDING' OR d.status = 'UPLOADING') 
                       AND sf.user_id = ? 
                       AND sf.semester_id = ${activeSemesterQuery}`,
                    [userId]
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