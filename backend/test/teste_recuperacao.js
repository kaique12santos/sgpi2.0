const API_URL = 'http://localhost:3000/api/auth';
const Database = require('../src/config/Database'); 

// Usuário que já criamos nos testes anteriores
// Se não existir, o teste vai falhar. Garanta que o email bate com o do banco.
const EMAIL_TESTE = "teste_123@fatec.sp.gov.br"; 

async function testeRecuperacao() {
    console.log('\n🔑 TESTE DE RECUPERAÇÃO DE SENHA...\n');

    try {
        // 1. SOLICITAR RESET
        console.log(`1. Solicitando reset para ${EMAIL_TESTE}...`);
        const resForgot = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL_TESTE })
        });
        const jsonForgot = await resForgot.json();
        
        if (!jsonForgot.success) throw new Error(`Falha ao pedir reset: ${jsonForgot.error}`);
        console.log('   ✅ Email de reset teoricamente enviado.');

        // 2. BUSCAR TOKEN NO BANCO (HACK DE TESTE)
        console.log('2. Buscando token gerado no banco...');
        const sql = `SELECT reset_token FROM users WHERE email = ?`;
        const rows = await Database.query(sql, [EMAIL_TESTE]);
        
        if (!rows[0] || !rows[0].reset_token) throw new Error('Token não gravado no banco.');
        
        const token = rows[0].reset_token;
        console.log(`   🔑 Token encontrado: ${token}`);

        // 3. DEFINIR NOVA SENHA
        const novaSenha = "senha_nova_super_segura_2026";
        console.log(`3. Trocando senha para: ${novaSenha}`);
        
        const resReset = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: EMAIL_TESTE,
                code: token,
                newPassword: novaSenha
            })
        });
        const jsonReset = await resReset.json();

        if (jsonReset.success) {
            console.log('   ✅ Senha alterada com sucesso!');
        } else {
            throw new Error(`Falha no reset: ${jsonReset.error}`);
        }

        // 4. TESTAR LOGIN COM NOVA SENHA
        console.log('4. Testando login com a senha nova...');
        const resLogin = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL_TESTE, password: novaSenha })
        });
        const jsonLogin = await resLogin.json();

        if (jsonLogin.success) {
            console.log('   🏆 SUCESSO TOTAL! Login efetuado.');
        } else {
            console.error('   ❌ Login falhou com senha nova:', jsonLogin);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0);
    }
}

testeRecuperacao();