/**
 * Script de Teste de Integração (Auth)
 * Requer que o servidor esteja rodando!
 */

// URL base do servidor
const API_URL = 'http://localhost:3000/api/auth';
// Dados de teste
const USER_TEST = {
    name: "Coordenador Teste",
    email: `coord_${Date.now()}@teste.com`, // Email único
    password: "senha_super_secreta",
    role: "coordenador"
};

async function testarAPI() {
    console.log('\n🔐 INICIANDO TESTE DE AUTENTICAÇÃO (API)...\n');

    try {
        // 1. Tentar REGISTRAR
        console.log(`1. Registrando usuário: ${USER_TEST.email}`);
        const resRegister = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER_TEST)
        });
        const jsonRegister = await resRegister.json();
        
        if (resRegister.ok) {
            console.log('✅ Registro SUCESSO:', jsonRegister);
        } else {
            console.error('❌ Registro FALHOU:', jsonRegister);
            return; // Para se falhar
        }

        // 2. Tentar LOGIN (Senha Certa)
        console.log(`\n2. Tentando LOGIN com senha correta...`);
        const resLogin = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: USER_TEST.email, 
                password: USER_TEST.password 
            })
        });
        const jsonLogin = await resLogin.json();

        if (resLogin.ok && jsonLogin.token) {
            console.log('✅ Login SUCESSO!');
            console.log('🔑 Token recebido:', jsonLogin.token.substring(0, 20) + '...');
            console.log('👤 Dados usuário:', jsonLogin.user);
        } else {
            console.error('❌ Login FALHOU:', jsonLogin);
        }

        // 3. Tentar LOGIN (Senha Errada)
        console.log(`\n3. Tentando LOGIN com senha ERRADA (Teste de Falha)...`);
        const resFail = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: USER_TEST.email, 
                password: "senha_errada_propositalmente" 
            })
        });
        
        if (resFail.status === 401) {
            console.log('✅ Sistema bloqueou senha errada corretamente (Status 401).');
        } else {
            console.error('❌ ERRO: Sistema permitiu ou deu erro 500 para senha errada.');
        }

    } catch (error) {
        console.error('❌ ERRO DE CONEXÃO: O servidor está rodando? (npm run dev)');
        console.error(error.message);
    }
}

testarAPI();