const API_URL = 'http://localhost:3000/api';
const USER = { email: "teste_123@fatec.sp.gov.br", password: "senha_super_secreta" };

async function testeDelete() {
    console.log('\n🗑️ TESTE DE EXCLUSÃO...\n');

    try {
        // 1. LOGIN
        const resLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const { token } = await resLogin.json();

        // 2. DESCOBRIR A PASTA DO PROFESSOR
        const resFolders = await fetch(`${API_URL}/folders/my-folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { folders } = await resFolders.json();
        const folderId = folders[0].id;

        // 3. CRIAR UM LINK FALSO PARA DELETAR DEPOIS
        console.log('Criando arquivo temporário para teste...');
        const resCreate = await fetch(`${API_URL}/links/add`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                folderId: folderId,
                title: 'Arquivo Errado',
                url: 'http://erro.com'
            })
        });
        const { document } = await resCreate.json();
        console.log(`✅ Criado item ID: ${document.id}`);

        // 4. DELETAR O ITEM
        console.log(`\nTentando deletar item ID ${document.id}...`);
        const resDelete = await fetch(`${API_URL}/management/documents/${document.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const deleteData = await resDelete.json();
        
        if (resDelete.ok) {
            console.log('✅ SUCESSO:', deleteData.message);
        } else {
            console.error('❌ FALHA:', deleteData);
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

testeDelete();