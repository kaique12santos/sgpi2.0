const API_URL = 'http://localhost:3000/api/auth';
const Database = require('../src/config/Database'); // Importamos para "roubar" o token do banco no teste

const NEW_USER = {
    name: "Aluno Verificado",
    email: `aluno_${Date.now()}@fatec.sp.gov.br`, // E-mail único
    password: "123",
    role: "professor"
};

async function testeAutenticacaoEmail() {
    console.log('\n📧 TESTE DE FLUXO DE VERIFICAÇÃO DE EMAIL...\n');

    try {
        // 1. REGISTRO
        console.log('1. Tentando Registrar...');
        const resReg = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(NEW_USER)
        });
        const jsonReg = await resReg.json();
        console.log('   Resposta:', jsonReg);

        if (!jsonReg.success) throw new Error('Falha no registro');

        // 2. TENTATIVA DE LOGIN (Deve falhar)
        console.log('\n2. Tentando logar SEM verificar (Deve falhar)...');
        const resLoginFail = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: NEW_USER.email, password: NEW_USER.password })
        });
        const jsonFail = await resLoginFail.json();
        
        if (resLoginFail.status === 403) {
            console.log('   ✅ Bloqueio funcionou:', jsonFail.error);
        } else {
            console.error('   ❌ ERRO: O sistema deixou logar!', jsonFail);
            return;
        }

        // 3. OBTER O TOKEN (Hack para teste automatizado)
        // Na vida real, o usuário leria o e-mail. Aqui vamos buscar no banco.
        console.log('\n3. Buscando token no Banco (Simulando leitura do e-mail)...');
        const sql = `SELECT verification_token FROM users WHERE email = ?`;
        const rows = await Database.query(sql, [NEW_USER.email]);
        const tokenReal = rows[0].verification_token;
        console.log(`   🔑 Token encontrado: ${tokenReal}`);

        // 4. VERIFICAR CONTA
        console.log('\n4. Enviando token para validar conta...');
        const resVerify = await fetch(`${API_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: NEW_USER.email, code: tokenReal })
        });
        const jsonVerify = await resVerify.json();
        console.log('   Resposta:', jsonVerify);

        // 5. LOGIN FINAL (Deve funcionar)
        console.log('\n5. Tentando logar APÓS verificar...');
        const resLoginOk = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: NEW_USER.email, password: NEW_USER.password })
        });
        const jsonOk = await resLoginOk.json();

        if (jsonOk.success) {
            console.log('   🏆 SUCESSO! Login realizado com Token:', jsonOk.token.substring(0, 15) + '...');
        } else {
            console.error('   ❌ Falha no login final:', jsonOk);
        }

    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        process.exit(0); // Encerra conexão do banco
    }
}

testeAutenticacaoEmail();