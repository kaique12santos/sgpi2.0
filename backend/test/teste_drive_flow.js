const API_URL = 'http://localhost:3000/api';

// 1. Dados para Login (Use um email que você já registrou no teste anterior)
const USER = {
    email: "teste_123@fatec.sp.gov.br", // Troque pelo email que você usou no teste_repo.js ou crie um novo
    password: "senha_super_secreta"    // Troque pela senha que usou no auth
};

async function testarFluxo() {
    console.log('\n📂 TESTE DE CRIAÇÃO DE PASTAS NO DRIVE...\n');

    try {
        // PASSO 1: LOGIN
        console.log('1. Fazendo Login...');
        const resLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const jsonLogin = await resLogin.json();

        if (!jsonLogin.success) {
            throw new Error(`Falha no login: ${jsonLogin.error}`);
        }
        const token = jsonLogin.token;
        console.log('✅ Login OK! Token obtido.');

        // PASSO 2: CRIAR PASTA
        console.log('\n2. Criando Pacote de Entrega...');
        const resCreate = await fetch(`${API_URL}/folders/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Pacote Teste ${Date.now()}`, // Nome único
                disciplineId: 2 // Assumindo que ID 2 existe no seu seed (Web I)
            })
        });

        const jsonCreate = await resCreate.json();
        
        if (resCreate.ok) {
            console.log('✅ SUCESSO! Pasta criada.');
            console.log('Link do Drive:', jsonCreate.folder.driveLink);
            console.log('\n---> AGORA ABRA SEU GOOGLE DRIVE E CONFIRA! <---');
        } else {
            console.error('❌ ERRO AO CRIAR:', jsonCreate);
        }

    } catch (error) {
        console.error('Erro Fatal:', error.message);
    }
}

testarFluxo();