// Script temporário para validar o UserRepository
const userRepo = require('../src/repositories/UserRepository');

async function testarRepositorio() {
    console.log('\n🔵 INICIANDO TESTE DO USER REPOSITORY...\n');

    const emailTeste = `teste_${Date.now()}@fatec.sp.gov.br`; // Gera email único para não dar erro de duplicidade
    
    try {
        // 1. Teste de Criação
        console.log('1. Tentando criar usuário...');
        const novoUsuario = {
            name: "Professor Teste",
            email: emailTeste,
            password_hash: "$2a$10$FakeHashParaTesteApenas123456", // Simulando um hash
            role: "professor"
        };

        const novoId = await userRepo.create(novoUsuario);
        console.log(`✅ Usuário criado com sucesso! ID gerado: ${novoId}`);

        // 2. Teste de Busca por E-mail
        console.log('\n2. Buscando usuário pelo e-mail...');
        const usuarioEncontrado = await userRepo.findByEmail(emailTeste);
        
        if (usuarioEncontrado && usuarioEncontrado.email === emailTeste) {
            console.log(`✅ Usuário encontrado: ${usuarioEncontrado.name} (${usuarioEncontrado.email})`);
        } else {
            console.error('❌ ERRO: Usuário não encontrado ou dados incorretos.');
        }

        // 3. Teste de Busca por ID
        console.log('\n3. Buscando usuário pelo ID...');
        const usuarioPeloId = await userRepo.findById(novoId);
        
        if (usuarioPeloId && usuarioPeloId.id === novoId) {
            console.log(`✅ Usuário recuperado pelo ID: Role = ${usuarioPeloId.role}`);
        } else {
            console.error('❌ ERRO: Não foi possível recuperar pelo ID.');
        }

    } catch (erro) {
        console.error('\n❌ ERRO FATAL NO TESTE:', erro.message);
    } finally {
        console.log('\n🔴 Fim do teste. (Pressione Ctrl+C se não encerrar sozinho)');
        process.exit(0);
    }
}

testarRepositorio();