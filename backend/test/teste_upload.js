const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3000/api';

// 1. Configuração do Usuário de Teste
const USER = {
    email: "teste_123@fatec.sp.gov.br", 
    password: "senha_nova_super_segura_2026"
};

async function testeUploadCompleto() {
    console.log('\n📤 TESTE DE UPLOAD COM FILA (WORKER)...\n');

    try {
        // --- ETAPA 1: LOGIN ---
        console.log('1. Autenticando...');
        const resLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const loginData = await resLogin.json();
        
        if (!loginData.success) throw new Error(`Login falhou: ${loginData.error}`);
        const token = loginData.token;
        console.log('✅ Token obtido.');

        // --- ETAPA 2: CRIAR PASTA DE DESTINO ---
        console.log('\n2. Criando pasta para receber o upload...');
        const resFolder = await fetch(`${API_URL}/folders/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: `Upload Teste ${Date.now()}`,
                disciplineId: 2
            })
        });
        const folderData = await resFolder.json();
        
        if (!resFolder.ok) throw new Error(`Criar pasta falhou: ${folderData.error}`);
        const folderId = folderData.folder.id;
        console.log(`✅ Pasta criada! ID no Banco: ${folderId}`);

        // --- ETAPA 3: PREPARAR ARQUIVO LOCAL ---
        console.log('\n3. Gerando arquivo dummy para teste...');
        const filePath = path.join(__dirname, 'dummy_test.txt');
        fs.writeFileSync(filePath, 'Conteúdo de teste para upload SGPI v2 - ' + new Date().toISOString());
        
        // --- ETAPA 4: ENVIAR O ARQUIVO (MULTIPART) ---
        console.log('4. Enviando arquivo para a API...');
        
        // Em Node.js nativo (v18+), usamos FormData assim:
        const formData = new FormData();
        formData.append('folderId', folderId);
        
        // Lendo o arquivo como Blob para o FormData
        const fileBuffer = fs.readFileSync(filePath);
        const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
        formData.append('files', fileBlob, 'dummy_test.txt');

        const resUpload = await fetch(`${API_URL}/uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Nota: Não defina Content-Type aqui! O fetch define automaticamente o boundary do multipart
            },
            body: formData
        });

        const uploadData = await resUpload.json();

        if (resUpload.ok) {
            console.log('\n✅ UPLOAD ACEITO PELO SERVIDOR!');
            console.log('Resposta:', uploadData);
            console.log('\n👀 AGORA OLHE O TERMINAL DO SERVIDOR (npm run dev)');
            console.log('   Você deve ver o [Worker] processando o arquivo em segundo plano.');
        } else {
            console.error('❌ Upload rejeitado:', uploadData);
        }

        // Limpeza (Apaga o arquivo gerado para o teste)
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error.message);
        if (error.cause) console.error(error.cause);
    }
}

testeUploadCompleto();