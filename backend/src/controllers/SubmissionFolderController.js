const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository'); // Importe o repositório

class SubmissionFolderController {
    // Rota para listar todas as pastas (para o select do upload)
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

    // função para criar nova pasta de entrega (pacote)
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
}

module.exports = new SubmissionFolderController();