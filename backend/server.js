const app = require('./src/app');
const UploadQueueWorker = require('./src/services/UploadQueueWorker');

let cleanupService;
try {
    cleanupService = require('./src/services/cleanupService');
} catch (e) {
    console.warn('⚠️ cleanupService ainda não está na pasta src/services. Agendamento ignorado.');
}
const semestreAutomationService = require('./src/services/SemesterAutomationService.js');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

/**
 * Inicialização de Serviços em Segundo Plano.
 * Inicia o "Lixeiro" para limpar a pasta de uploads temporários.
 */
if (cleanupService && typeof cleanupService.iniciarAgendamento === 'function') {
    cleanupService.iniciarAgendamento();
}

// Verifica se ficaram uploads pendentes quando o servidor reiniciou
UploadQueueWorker.processQueue();

//verifica e cria semestres automaticamente
semestreAutomationService.init();

/**
 * Inicialização do Servidor HTTP.
 */
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 SGPI 2.0 (GED) rodando na porta ${PORT}`);
    console.log(`📁 Modo: Gestão Documental`);
    console.log(`=========================================\n`);
});