const GoogleDriveService = require('../services/googleDriveService.js');
const Database = require('../config/Database.js');

/**
 * Controller para criar a estrutura inicial de pastas no Google Drive e no banco de dados.
 * 
 * O endpoint POST /setup/create-semester-folders é um script de configuração que
 * deve ser executado apenas uma vez para criar a estrutura de pastas do semestre
 * no Google Drive e as entradas correspondentes no banco de dados.
 * Ele cria uma pasta para o semestre (ex: "2099_2") e, dentro dela, pastas para cada disciplina cadastrada. 
 * Cada pasta de disciplina é registrada na tabela submission_folders com o ID da pasta do Drive.
 */

class SetupController {

    /**
     * Roda o script de criação de pastas para um semestre específico.
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns JSON com o resultado da operação
     * 
     * NOTA: Este endpoint deve ser protegido (ex: autenticação + verificação de papel) 
     * para evitar execuções acidentais.
     */
    async createSemesterFolders(req, res) {

        const ROOT_FOLDER_ID = '14qPDNB_-r2_jwcVZegJQ-aD4SsqFACtm';
        const SEMESTER_NAME = '2099_2'; // Semestre de teste

        try {
            console.log(` Iniciando criação de pastas para ${SEMESTER_NAME}...`);

            const semesterResult = await GoogleDriveService.createFolder(SEMESTER_NAME, ROOT_FOLDER_ID);
            const semesterFolderId = semesterResult.id || semesterResult;

            console.log(` Pasta do semestre criada com ID: ${semesterFolderId}`);

            const disciplines = await Database.query("SELECT * FROM disciplines");
            const results = [];

            for (const discipline of disciplines) {

                const disciplineResult = await GoogleDriveService.createFolder(discipline.name, semesterFolderId);
                const driveFolderId = disciplineResult.id || disciplineResult;
                const sqlInsert = `
                    INSERT INTO submission_folders 
                    (title, user_id, semester_id, discipline_id, drive_folder_id)
                    VALUES (?, ?, ?, ?, ?)
                `;

                await Database.query(sqlInsert, [
                    `Envios - ${discipline.name}`,
                    1,
                    1,
                    discipline.id,
                    driveFolderId
                ]);

                results.push({ discipline: discipline.name, driveId: driveFolderId });
                console.log(`  -> Pasta criada: ${discipline.name} (${driveFolderId})`);
            }

            return res.json({
                message: 'Estrutura criada com sucesso!',
                foldersCreated: results
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar estrutura de pastas.' });
        }

    }
}

module.exports = new SetupController();