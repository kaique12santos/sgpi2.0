const API_URL = 'http://localhost:3000/api/auth';

const USER_TEST = {
    name: "Professor Tester",
    email: "teste_123@fatec.sp.gov.br", // O mesmo email do teste_drive_flow
    password: "senha_super_secreta",     // A mesma senha do teste_drive_flow
    role: "professor"
};

async function registrarUsuario() {
    console.log('🔨 Criando usuário de teste no banco...');

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER_TEST)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Usuário criado com sucesso! ID:', data.userId);
        } else if (data.error === 'Email já cadastrado.') {
            console.log('⚠️ O usuário já existe. Pode prosseguir para o teste de login.');
        } else {
            console.error('❌ Erro ao criar usuário:', data);
        }

    } catch (error) {
        console.error('Erro de conexão:', error.message);
        console.log('Dica: Verifique se o servidor está rodando (npm run dev).');
    }
}

registrarUsuario();