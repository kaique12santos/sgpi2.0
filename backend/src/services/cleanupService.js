const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class CleanupService {
    constructor() {

        this.uploadDir = path.join(__dirname, '../../uploads');
        
        // Tempo de vida do arquivo: 1 hora (em milissegundos)
        // Arquivos mais velhos que isso serão deletados
        this.MAX_AGE = 60 * 60 * 1000; 
    }

    iniciarAgendamento() {
        // Roda a cada 1 hora: '0 * * * *'
        // Roda todo dia às 04:00 da manhã: '0 4 * * *' (Recomendado para produção)
        cron.schedule('0 4 * * *', () => {
            console.log('🧹 [Cleanup] Iniciando limpeza de arquivos temporários...');
            this.limparPasta();
        });
        console.log('✅ Serviço de Limpeza (Cleanup) agendado para 04:00 AM.');
    }

    limparPasta() {
        if (!fs.existsSync(this.uploadDir)) {
            console.log('⚠️ [Cleanup] Pasta uploads não existe. Nada a fazer.');
            return;
        }

        fs.readdir(this.uploadDir, (err, files) => {
            if (err) {
                console.error('❌ [Cleanup] Erro ao ler pasta:', err);
                return;
            }

            const now = Date.now();
            let removidos = 0;

            files.forEach(file => {
                const filePath = path.join(this.uploadDir, file);
                
                fs.stat(filePath, (err, stats) => {
                    if (err) return;

                    // Se a data de modificação + MAX_AGE for menor que Agora, expirou.
                    if (now - stats.mtimeMs > this.MAX_AGE) {
                        fs.unlink(filePath, (err) => {
                            if (err) console.error(`❌ Erro ao deletar ${file}:`, err);
                            else {
                                console.log(`🗑️ [Cleanup] Removido arquivo antigo: ${file}`);
                                removidos++;
                            }
                        });
                    }
                });
            });
        });
    }
}

module.exports = new CleanupService();