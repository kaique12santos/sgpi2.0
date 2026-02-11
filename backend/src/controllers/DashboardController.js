const Database = require('../config/Database');

class DashboardController {
    async getStats(req, res) {
        try {
            const userId = req.userId; // ID do professor logado

            const [userRows] = await Database.query('SELECT role FROM users WHERE id = ?', [userId]);
            const userRole = userRows.role || 'professor';
            let stats = {};

            if (userRole === 'coordenador') {
                // --- ESTATÍSTICAS DO COORDENADOR (GLOBAIS) ---
                
                // 1. Total de Pastas (SubmissionFolder) de TODO O SISTEMA
                const [folders] = await Database.query(`SELECT COUNT(*) as total FROM submission_folders`);

                // 2. Espaço total usado no Drive (Soma de todos os documentos COMPLETED)
                const [storage] = await Database.query(`SELECT SUM(size_bytes) as total FROM documents WHERE status = 'COMPLETED'`);

                // 3. Total de Professores (Já que não temos alunos, contar usuários pode ser útil, ou remova se preferir)
                const [users] = await Database.query(`SELECT COUNT(*) as total FROM users`);

                stats = {
                    totalFolders: folders.total,
                    totalStorage: storage.total,
                    totalUsers: users.total, 
                };

            } else {

                // 2. Total de Entregas (Pastas criadas)
                const [submissions] = await Database.query(
                    `SELECT COUNT(*) as total FROM submission_folders WHERE user_id = ?`,
                    [userId]
                );

                // 3. Documentos pendentes de processamento (Worker)
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