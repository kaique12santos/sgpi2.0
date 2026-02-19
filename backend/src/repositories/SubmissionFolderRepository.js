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
     * Lista TODAS as pastas (para o select de upload).
     * Traz junto o nome da disciplina.
     */
    async findAll() {
        const sql = `
            SELECT sf.*, d.name as discipline_name, s.label as semester_label
            FROM submission_folders sf
            LEFT JOIN disciplines d ON sf.discipline_id = d.id
            LEFT JOIN semesters s ON sf.semester_id = s.id
            
            ORDER BY sf.created_at DESC
        `;
        return await Database.query(sql);
    }

    /**
     * Busca pasta pelo ID (com info do dono).
     */
    async findById(id) {
        const sql = `SELECT * FROM submission_folders WHERE id = ?`;
        const rows = await Database.query(sql, [id]);
        return rows[0];
    }

    async updateTitle(id, newTitle) {
        const sql = `UPDATE submission_folders SET title = ? WHERE id = ?`;
        await Database.query(sql, [newTitle, id]);
    }

    async delete(id) {

        await Database.query(`DELETE FROM documents WHERE folder_id = ?`, [id]);
       
        const sql = `DELETE FROM submission_folders WHERE id = ?`;
        
        await Database.query(sql, [id]);
    }

    /**
     * Tenta encontrar o ID do Drive de uma pasta de disciplina já criada anteriormente
     * para não criar duplicada.
     * Retorna NULL se não achar.
     */
    async findDriveIdByDisciplineAndSemester(disciplineId, semesterId) {
        // Buscamos qualquer pasta criada para essa disciplina nesse semestre
        // e pegamos o pai dela (que seria a pasta da disciplina no drive?)
        // OU, idealmente, você teria uma tabela separada para mapear Disciplina -> DriveID.
        
        // POG (Programação Orientada a Gambiarra) Inteligente para o momento:
        // Vamos procurar se já existe algum submission_folder dessa disciplina.
        // Se existir, pegamos o "parent" dele no Google Drive (via Service) ou
        // assumimos que você vai implementar uma lógica de cache.
        
        // SIMPLIFICAÇÃO PARA O TESTE AGORA:
        // Como sua tabela submission_folders guarda OS PACOTES FINAIS, 
        // ela não guarda o ID da pasta da disciplina.
        // Retornamos null para ele criar a pasta (Pode gerar duplicata no Drive visualmente, 
        // mas o sistema funciona).
        
        return null; 
        
        // NOTA: Para produção, o ideal é ter uma tabela `discipline_semesters` 
        // com colunas: id, semester_id, discipline_id, drive_folder_id.
    }

    /**
     * Lista as pastas de um professor com estatísticas de documentos.
     * Retorna: ID, Título, Disciplina, Semestre, Link Drive, Qtd Arquivos, Qtd Pendentes
     */
    async findByUserWithStats(userId) {
        const sql = `
            SELECT 
                sf.id,
                sf.title,
                sf.created_at,
                sf.drive_folder_id,
                d.name as discipline_name,
                s.label as semester_label,
                -- CORREÇÃO AQUI TAMBÉM:
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id) as total_files,
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id AND doc.status IN ('PENDING', 'UPLOADING')) as pending_files,
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id AND doc.status = 'ERROR') as error_files
            
            FROM submission_folders sf
            JOIN disciplines d ON sf.discipline_id = d.id
            JOIN semesters s ON sf.semester_id = s.id
            WHERE sf.user_id = ?
            ORDER BY sf.created_at DESC
        `;
        
        return await Database.query(sql, [userId]);
    }

   /**
     * [COORDENADOR] Lista TODAS as pastas do sistema com estatísticas e nome do professor.
     */
    async findAllWithDetails() {
        const sql = `
            SELECT 
                sf.id,
                sf.title,
                sf.created_at,
                sf.drive_folder_id,
                u.name as professor_name,
                d.name as discipline_name,
                s.label as semester_label,
                
                -- CORREÇÃO AQUI: Usar 'sf.id' em vez de 'sf.drive_folder_id'
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id) as total_files,
                
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id AND doc.status IN ('PENDING', 'UPLOADING')) as pending_files,
                
                (SELECT COUNT(*) FROM documents doc WHERE doc.folder_id = sf.id AND doc.status = 'ERROR') as error_files
            
            FROM submission_folders sf
            JOIN users u ON sf.user_id = u.id
            JOIN disciplines d ON sf.discipline_id = d.id
            JOIN semesters s ON sf.semester_id = s.id
            ORDER BY sf.created_at DESC
        `;
        
        return await Database.query(sql);
    }
}

module.exports = new SubmissionFolderRepository();