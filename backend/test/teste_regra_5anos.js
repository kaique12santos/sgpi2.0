
const API_URL = 'http://localhost:3000/api';
const Database = require('../src/config/Database');

// IMPORTANTE: Use aqui uma conta que seja COORDENADOR no banco
const COORD_USER = { 
    email: "coord_1769972822445@teste.com", 
    password: "senha_super_secreta" 
};

async function testeRegra5Anos() {
    console.log('\n📅 TESTE DA REGRA DE 5 ANOS (Visão do Coordenador)...\n');

    try {
        // 1. LOGIN COMO COORDENADOR
        console.log('1. Logando como Coordenador...');
        const resLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(COORD_USER)
        });
        const loginData = await resLogin.json();
        
        if (!loginData.success) throw new Error(`Falha no login: ${loginData.error}`);
        
        // Verifica se é mesmo coordenador (só para garantir o teste)
        if (loginData.user.role !== 'coordenador') {
            console.warn('⚠️ ATENÇÃO: O usuário deste teste NÃO é coordenador no banco.');
            console.warn('   O teste vai falhar com 403 (Sem permissão) antes de testar a data.');
            console.warn('   Rode no MySQL: UPDATE users SET role="coordenador" WHERE email="..."');
        }

        const token = loginData.token;

        // 2. BUSCAR ALVO NO BANCO (Simulando o Coord selecionando uma pasta na tela)
        // Pegamos a última pasta criada no sistema, independente de quem criou
        console.log('2. Buscando pasta alvo no sistema...');
        const sql = `SELECT * FROM submission_folders ORDER BY id DESC LIMIT 1`;
        const rows = await Database.query(sql);
        
        if (rows.length === 0) {
            throw new Error('❌ Nenhuma pasta encontrada no banco. Rode o "teste_upload.js" primeiro.');
        }

        const pastaAlvo = rows[0];
        console.log(`🎯 Alvo encontrado: ID ${pastaAlvo.id} - "${pastaAlvo.title}" (Criada em: ${pastaAlvo.created_at})`);

        // 3. TENTAR APAGAR (AÇÃO DO COORDENADOR)
        console.log(`3. Tentando deletar pasta ID ${pastaAlvo.id}...`);
        
        const resDelete = await fetch(`${API_URL}/management/folders/${pastaAlvo.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const jsonDelete = await resDelete.json();

        // 4. ANÁLISE DO RESULTADO
        if (resDelete.status === 400) {
            // Status 400 é o que definimos para o bloqueio da regra de negócio (Bad Request)
            console.log('\n✅ SUCESSO: O Bloqueio Legal funcionou!');
            console.log(`   Motivo retornado: "${jsonDelete.error}"`);
        } 
        else if (resDelete.status === 200) {
            console.log('\n⚠️ AVISO: A pasta foi apagada.');
            console.log('   Isso só deveria acontecer se a pasta estivesse VAZIA ou se fosse ANTIGA (>5 anos).');
            console.log('   Verifique se a pasta tinha arquivos dentro.');
        } 
        else {
            console.log(`\n❌ Resultado inesperado (Status ${resDelete.status}):`, jsonDelete);
        }

    } catch (e) {
        console.error('❌ Erro no teste:', e.message);
    } finally {
        process.exit(0);
    }
}

testeRegra5Anos();