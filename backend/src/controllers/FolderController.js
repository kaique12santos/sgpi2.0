const DriveService = require('../services/googleDriveService');
const MetadataRepository = require('../repositories/MetadataRepository');
const SubmissionFolderRepository = require('../repositories/SubmissionFolderRepository');

class FolderController {

    /**
     * Cria uma nova estrutura de pastas (Pacote) para entrega.
     * Fluxo:
     * 1. Valida dados.
     * 2. Garante existência da pasta do Semestre (Raiz).
     * 3. Garante existência da pasta da Disciplina (Subpasta).
     * 4. Cria a pasta final do Título (Ex: "Provas P1").
     * 5. Salva no banco.
     */
    async create(req, res) {
        try {
            const { title, disciplineId } = req.body;
            const userId = req.userId; // Vem do AuthMiddleware

            if (!title || !disciplineId) {
                return res.status(400).json({ error: 'Título e Disciplina são obrigatórios.' });
            }

            // 1. Buscar Semestre Ativo e Disciplina
            const semester = await MetadataRepository.findActiveSemester();
            const discipline = await MetadataRepository.findDisciplineById(disciplineId);

            if (!semester) return res.status(400).json({ error: 'Nenhum semestre ativo configurado.' });
            if (!discipline) return res.status(400).json({ error: 'Disciplina inválida.' });

            // 2. Lógica do Drive: Validar/Criar Pasta Raiz do Semestre
            // Se o semestre ainda não tem ID do Drive no banco, criamos agora (Primeiro uso)
            let semesterFolderId = semester.drive_root_id;
            
            // OBS: O ID da pasta "Mãe de Todas" (SGPI_ACADEMIC) deve estar no .env
            const ACADEMIC_ROOT = process.env.DRIVE_ID_ACADEMIC; 

            if (!semesterFolderId) {
                const folder = await DriveService.createFolder(semester.label, ACADEMIC_ROOT);
                semesterFolderId = folder.id;
                // TODO: Atualizar o banco com esse ID (Faremos isso num updateRepository depois)
                console.log(`📁 Pasta do Semestre ${semester.label} criada: ${semesterFolderId}`);
            }

            // 3. Lógica do Drive: Validar/Criar Pasta da Disciplina
            // A pasta da disciplina fica dentro da pasta do semestre
            const disciplineFolder = await DriveService.createFolder(discipline.name, semesterFolderId);

            // 4. Lógica do Drive: Criar a Pasta Final (O Pacote)
            const packageFolder = await DriveService.createFolder(title, disciplineFolder.id);

            // 5. Salvar no Banco
            const newId = await SubmissionFolderRepository.create({
                title,
                user_id: userId,
                semester_id: semester.id,
                discipline_id: discipline.id,
                drive_folder_id: packageFolder.id
            });

            return res.status(201).json({
                success: true,
                message: 'Pacote criado com sucesso!',
                folder: {
                    id: newId,
                    title,
                    driveLink: packageFolder.webViewLink
                }
            });

        } catch (error) {
            console.error('Erro ao criar pasta:', error);
            return res.status(500).json({ error: 'Erro interno ao criar estrutura de pastas.' });
        }
    }

    /**
     * Lista os pacotes criados pelo professor logado.
     */
    async listMyFolders(req, res) {
        try {
            const folders = await SubmissionFolderRepository.findByProfessor(req.userId);
            res.json({ success: true, folders });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar pastas.' });
        }
    }

    /**
     * Lista todas as pastas do sistema (Apenas Coordenador).
     */
    async listAll(req, res) {
        try {
            // Opcional: Se seu middleware de auth não bloquear roles, bloqueie aqui
            if (req.userRole !== 'coordenador') return res.status(403).json({ error: 'Acesso negado. Somente coordenadores podem acessar todas as pastas.' });

            const folders = await SubmissionFolderRepository.findAllWithDetails();
            res.json({ success: true, folders });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao listar todas as pastas.' });
        }
    }

    /**
     * UPDATE: Renomear pasta
     * Regra: Exclusivo do Professor DONO da pasta.
     */
    async update(req, res) {
        try {
            const { id } = req.params; // ID do banco (não do Drive)
            const { title } = req.body;
            const userId = req.userId; // ID do professor logado

            // 1. Busca a pasta no banco para ver quem é o dono
            const folder = await SubmissionFolderRepository.findById(id);
            if (!folder) return res.status(404).json({ error: 'Pasta não encontrada.' });

            // 2. AQUI ESTÁ A REGRA DE EXCLUSIVIDADE 🔒
            // Se o ID do usuário logado for diferente do dono da pasta...
            if (folder.user_id !== userId) {
                return res.status(403).json({ error: 'Acesso negado: Você só pode editar suas próprias pastas.' });
            }

            // 3. Se passou, chama o serviço genérico para atualizar no Drive
            await DriveService.renameFile(folder.drive_folder_id, title);

            // 4. Atualiza no Banco
            await SubmissionFolderRepository.updateTitle(id, title);

            return res.json({ success: true, message: 'Pasta renomeada com sucesso.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar pasta.' });
        }
    }

    /**
     * DELETE: Apagar pasta
     * Regra: Exclusivo do Professor DONO da pasta.
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            // 1. Busca pasta
            const folder = await SubmissionFolderRepository.findById(id);
            if (!folder) return res.status(404).json({ error: 'Pasta não encontrada.' });

            // 2. REGRA DE EXCLUSIVIDADE 🔒
            if (folder.user_id !== userId) {
                return res.status(403).json({ error: 'Acesso negado: Você só pode excluir suas próprias pastas.' });
            }

            // 3. Move para a lixeira no Drive (Usando seu método genérico)
            await DriveService.deleteFile(folder.drive_folder_id);

            // 4. Remove do Banco (Cascade remove os documentos)
            await SubmissionFolderRepository.delete(id);

            return res.json({ success: true, message: 'Pacote removido com sucesso.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao excluir pasta.' });
        }
    }
}

module.exports = new FolderController();