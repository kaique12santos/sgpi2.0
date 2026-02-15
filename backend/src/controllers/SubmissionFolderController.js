const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository'); // Importe o repositório
/**
 * Controller para gerenciar as pastas de entrega (SubmissionFolder) e seus arquivos.
 */
class SubmissionFolderController {
    
    /**
     * Lista todas as pastas de entrega (SubmissionFolder) do sistema.
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns JSON com todas as pastas de entrega
     */
    async index(req, res) {
        try {
            // Usa o novo método do repositório
            const folders = await SubmissionFolderRepository.findAll();
            
            // Opcional: Se quiser formatar aqui para facilitar pro front
            // Mas pode mandar cru também
            return res.json(folders);
        } catch (error) {
            console.error('Erro ao listar pastas:', error);
            return res.status(500).json({ error: 'Erro ao buscar disciplinas.' });
        }
    }

    /**
     * Cria uma nova pasta de entrega (SubmissionFolder) e retorna seu ID.
     * @param {Object} param0 - Parâmetros da nova pasta
     * @param {string} param0.title - Título da nova pasta
     * @param {number} param0.user_id - ID do usuário que criou
     * @param {string} param0.drive_folder_id - ID da pasta no Google Drive
     * @param {string} param0.parent_drive_id - ID da pasta pai (disciplina)
     * @returns {number} ID da nova pasta criada
     */
    async createNewPacket({ title, user_id, drive_folder_id, parent_drive_id }) {
        // Truque ninja: Usamos o parent_drive_id (ID da pasta da disciplina) 
        // para descobrir qual é o discipline_id e semester_id corretos via subquery
        const sql = `
            INSERT INTO submission_folders 
            (title, user_id, semester_id, discipline_id, drive_folder_id)
            SELECT 
                ?, -- title
                ?, -- user_id
                sf.semester_id, 
                sf.discipline_id,
                ?  -- drive_folder_id (novo ID da subpasta)
            FROM submission_folders sf
            WHERE sf.drive_folder_id = ? -- ID da pasta Pai (Disciplina)
            LIMIT 1
        `;

        const result = await Database.query(sql, [
            title, 
            user_id, 
            drive_folder_id, 
            parent_drive_id
        ]);

        return result.insertId;
    }

    /**
     * Lista as pastas de entrega do usuário logado, com estatísticas (total de arquivos, total processados, etc).
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns JSON com as pastas do usuário logado
     */
    async listMyFolders(req, res) {
        try {
            const userId = req.userId; // Vem do AuthMiddleware
            const folders = await SubmissionFolderRepository.findByUserWithStats(userId);
            
            return res.json(folders);
        } catch (error) {
            console.error('Erro ao listar meus pacotes:', error);
            return res.status(500).json({ error: 'Erro ao buscar seus envios.' });
        }
    }

   /**
     * [COORDENADOR] Lista todas as pastas do sistema.
     * Rota: GET /folders
     */
    async getAllFolders(req, res) {
        try {
            // Chama o repositório que já faz o trabalho pesado
            const folders = await SubmissionFolderRepository.findAllWithDetails();
            
            return res.json(folders);
            
        } catch (error) {
            console.error('Erro ao listar todas as pastas (Admin):', error);
            return res.status(500).json({ error: 'Erro interno ao buscar pastas.' });
        }
    }
}

module.exports = new SubmissionFolderController();