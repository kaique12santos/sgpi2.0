const DriveService = require('../services/googleDriveService');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');
const DocumentRepository = require('../repositories/DocumentRepository');
const UploadQueueWorker = require('../services/UploadQueueWorker');
const MetadataRepository = require('../repositories/MetadataRepository');


class UploadController {

    /**
     * Recebe os arquivos do Multer e enfileira para processamento.
     */
    async uploadFiles(req, res) {
        console.log("--- UPLOAD: FLUXO HIERÁRQUICO COMPLETO ---");

        try {
            // No Frontend, o select envia 'discipline' (ID numérico) e o input text envia 'title'
            const { package_id: disciplineId, title } = req.body; 
            const files = req.files; 
            const userId = req.userId || 1;

            // 1. Validações Básicas
            if (!files || files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
            if (!disciplineId) return res.status(400).json({ error: 'Selecione uma disciplina.' });
            if (!title) return res.status(400).json({ error: 'Defina um título para a entrega.' });

            // 2. Buscar Dados do Banco (Lógica do FolderController)
            const semester = await MetadataRepository.findActiveSemester();
            if (!semester) return res.status(400).json({ error: 'Nenhum semestre ativo configurado.' });

            const discipline = await MetadataRepository.findDisciplineById(disciplineId);
            if (!discipline) return res.status(400).json({ error: 'Disciplina inválida.' });

            // 3. GARANTIR ESTRUTURA NO DRIVE
            // A. Pasta Raiz (Academic)
            const ACADEMIC_ROOT = process.env.DRIVE_ID_ACADEMIC || 'root'; // Fallback
            
            // B. Pasta do Semestre (Ex: 2026_1)
            // Se o semestre já tem ID salvo, usa. Se não, cria.
            let semesterFolderId = semester.drive_root_id;
            if (!semesterFolderId) {
                console.log(`> Criando pasta do semestre: ${semester.label}`);
                const sFolder = await DriveService.createFolder(semester.label, ACADEMIC_ROOT);
                semesterFolderId = sFolder.id;
                // TODO: Importante salvar esse ID no banco (tabela semesters) para não criar de novo
            }

            // C. Pasta da Disciplina (Ex: Eng. Software I)
            // LÓGICA CRUCIAL: Verificar se já existe pasta dessa disciplina neste semestre
            let disciplineDriveId = await SubmissionFolderRepository.findDriveIdByDisciplineAndSemester(discipline.id, semester.id);
            
            if (!disciplineDriveId) {
                console.log(`> Criando pasta da disciplina: ${discipline.name}`);
                const dFolder = await DriveService.createFolder(discipline.name, semesterFolderId);
                disciplineDriveId = dFolder.id;

                // Salvamos um registro "placeholder" só pra guardar o ID da pasta da disciplina
                // Ou idealmente, sua tabela 'submission_folders' poderia ter um flag is_root=true
                // Para simplificar agora, vamos apenas seguir e criar a subpasta
            }

            // 4. CRIAR O PACOTE FINAL (Ex: "Sprint 1")
            // Esta é a pasta onde os arquivos realmente vão ficar
            console.log(`> Criando pacote '${title}' dentro da disciplina...`);
            const packageFolder = await DriveService.createFolder(title, disciplineDriveId);
            const packageDriveId = packageFolder.id;

            // 5. REGISTRAR NO BANCO (submission_folders)
            const newDbFolderId = await SubmissionFolderRepository.create({
                title: title,
                user_id: userId,
                semester_id: semester.id,
                discipline_id: discipline.id,
                drive_folder_id: packageDriveId
            });

            console.log(`> Estrutura pronta! ID Banco: ${newDbFolderId} | ID Drive: ${packageDriveId}`);

            // 6. ENFILEIRAR ARQUIVOS
            const savedDocs = [];

            for (const file of files) {
                // Salvamos referenciando a PASTA NOVA (newDbFolderId / packageDriveId)
                const docId = await DocumentRepository.create({
                    folder_id: packageDriveId, // ID do Drive da pasta "Sprint 1"
                    title: title,
                    original_name: file.originalname,
                    local_path: file.path, 
                    mime_type: file.mimetype,
                    size_bytes: file.size,
                    status: 'PENDING'
                });
                
                savedDocs.push({ id: docId, name: file.originalname, status: 'PENDING' });
            }

            // 7. Acordar Worker
            UploadQueueWorker.processQueue();

            return res.status(201).json({
                success: true,
                message: 'Upload iniciado com sucesso.',
                folder_id: newDbFolderId,
                documents: savedDocs
            });

        } catch (error) {
            console.error('Erro no UploadController:', error);
            return res.status(500).json({ error: 'Falha no processo de upload.' });
        }
    }
}

module.exports = new UploadController();