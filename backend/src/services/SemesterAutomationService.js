const cron = require('node-cron');
const SemesterRepository = require('../repositories/SemesterRepository');
const DriveService = require('./googleDriveService');

class SemesterAutomationService {

    constructor() {
        // Datas de corte: Dia/Mês
        this.TRANSICAO_1 = '15/01'; // Vira para o 1º Semestre do ano
        this.TRANSICAO_2 = '15/07'; // Vira para o 2º Semestre do ano
    }

    /**
     * Inicia o agendamento (Cron Job).
     * Roda todos os dias às 00:00:01 (Meia-noite e um segundo).
     */
    init() {
        cron.schedule('1 0 * * *', async () => {
            console.log('⏰ [Cron] Verificando transição de semestre...');
            await this.checkAndRotateSemester();
        });
        console.log('⏳ Serviço de Automação de Semestres iniciado.');
    }

    /**
     * Verifica se hoje é dia de mudar o semestre.
     */
    async checkAndRotateSemester() {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        
        const dataFormatada = `${dia}/${mes}`;
        let novoLabel = '';

        // Define qual semestre deveria ser criado hoje
        if (dataFormatada === this.TRANSICAO_1) {
            novoLabel = `${ano}_1`;
        } else if (dataFormatada === this.TRANSICAO_2) {
            novoLabel = `${ano}_2`;
        } else {
            // Não é dia de mudança
            return;
        }

        console.log(`🔄 [AutoSemester] Data de corte detectada! Preparando: ${novoLabel}`);

        try {
            // 1. Verifica se já existe para não duplicar
            const existe = await SemesterRepository.findByLabel(novoLabel);
            if (existe) {
                console.log(`⚠️ [AutoSemester] O semestre ${novoLabel} já existe. Ignorando.`);
                return;
            }

            // 2. Cria a pasta no Google Drive
            // Pega o ID da pasta "Mãe" (ACADEMIC_ROOT) do .env
            const parentId = process.env.DRIVE_ID_ACADEMIC;
            if (!parentId) throw new Error('DRIVE_ID_ACADEMIC não configurado no .env');

            console.log(`📂 [AutoSemester] Criando pasta no Drive...`);
            const folder = await DriveService.createFolder(novoLabel, parentId);

            // 3. Salva no Banco e torna Ativo
            await SemesterRepository.create({
                label: novoLabel,
                drive_root_id: folder.id
            });

            console.log(`✅ [AutoSemester] Sucesso! Novo semestre ${novoLabel} está ativo.`);

        } catch (error) {
            console.error(`❌ [AutoSemester] Erro crítico ao virar semestre:`, error);
        }
    }
}

module.exports = new SemesterAutomationService();