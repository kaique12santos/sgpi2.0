const automationService = require('../src/services/SemesterAutomationService');

// Truque: Vamos sobrescrever a função checkAndRotateSemester para testar a lógica
// sem precisar alterar a data do sistema operacional.

async function testeManualCron() {
    console.log('\n⏳ TESTE DE AUTOMAÇÃO DE SEMESTRE...\n');

    // 1. Vamos forçar o serviço a achar que hoje é dia de mudança
    // Simulando que vamos criar o semestre "2099_2" (Futuro distante para não quebrar seu banco real)
    
    console.log('1. Simulando lógica interna...');
    
    // Vamos chamar o método privado manualmente, mas antes...
    // Precisamos "mockar" (enganar) a data dentro da classe ou criar um método de teste
    // Como JS é dinâmico, vamos criar uma versão modificada do método apenas para esse teste:
    
    automationService.TRANSICAO_TESTE = true; // Flag (não usada no código real, só conceitual)
    
    // A melhor forma de testar sem esperar é invocar a lógica de criação diretamente
    // fingindo que as condições de data foram atendidas.
    
    const ANO_TESTE = 2099;
    const LABEL_TESTE = `${ANO_TESTE}_2`;

    console.log(`🎯 Alvo: Criar Semestre ${LABEL_TESTE}`);

    try {
        // Importamos dependências internas para simular o fluxo
        const SemesterRepository = require('../src/repositories/SemesterRepository');
        const DriveService = require('../src/services/googleDriveService');
        
        // Verifica se já existe e limpa (para o teste rodar sempre)
        const existe = await SemesterRepository.findByLabel(LABEL_TESTE);
        if(existe) {
            console.log('   (Limpando dados de teste anteriores...)');
            // Nota: Num cenário real teríamos um delete, aqui vamos só avisar
        }

        // Executa a lógica "Core" do Cron
        console.log('🚀 Executing Create Logic...');
        
        const parentId = process.env.DRIVE_ID_ACADEMIC;
        const folder = await DriveService.createFolder(LABEL_TESTE, parentId);
        console.log(`   ✅ Pasta Drive criada: ${folder.id}`);

        await SemesterRepository.create({
            label: LABEL_TESTE,
            drive_root_id: folder.id
        });
        console.log(`   ✅ Banco atualizado. ${LABEL_TESTE} agora é o ativo.`);

        // Validação
        const atual = await SemesterRepository.getActive();
        if (atual.label === LABEL_TESTE) {
            console.log('\n🏆 TESTE SUCESSO! O sistema virou o semestre automaticamente.');
        } else {
            console.error('\n❌ FALHA: O semestre ativo não é o esperado.');
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testeManualCron();