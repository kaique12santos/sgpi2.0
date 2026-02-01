const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const API_URL = 'http://localhost:3000/api';
const OUTPUT_FILE = path.join(__dirname, 'download_teste.zip');

const USER = {
    email: "teste_123@fatec.sp.gov.br",
    password: "senha_super_secreta"
};

async function testeDownload() {
    console.log('\n📦 TESTE DE DOWNLOAD (STREAMING ZIP)...\n');

    try {
        // 1. LOGIN
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

        // 2. DESCOBRIR UMA PASTA PARA BAIXAR
        console.log('\n2. Buscando uma pasta existente...');
        const resList = await fetch(`${API_URL}/folders/my-folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await resList.json();

        if (!listData.folders || listData.folders.length === 0) {
            throw new Error('❌ Nenhuma pasta encontrada. Rode o teste de upload primeiro!');
        }

        // Pega a pasta mais recente
        const targetFolder = listData.folders[0]; 
        console.log(`🎯 Alvo encontrado: ID ${targetFolder.id} - "${targetFolder.title}"`);

        // 3. FAZER O DOWNLOAD
        console.log(`\n3. Solicitando ZIP (Stream)...`);
        const resDownload = await fetch(`${API_URL}/downloads/folder/${targetFolder.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resDownload.ok) {
            const erroJson = await resDownload.json();
            throw new Error(`Erro no Download: ${erroJson.error}`);
        }

        // 4. SALVAR O STREAM NO DISCO
        console.log('⏳ Recebendo dados e gravando no disco...');
        
        // Cria o arquivo vazio para escrita
        const fileWriter = fs.createWriteStream(OUTPUT_FILE);

        // Conecta o corpo da resposta (Web Stream) ao arquivo (Node Stream)
        // O pipeline garante que se der erro no meio, ele avisa
        if (resDownload.body) {
            await pipeline(Readable.fromWeb(resDownload.body), fileWriter);
            console.log(`\n✅ SUCESSO! Arquivo salvo em:`);
            console.log(`   📂 ${OUTPUT_FILE}`);
            
            // Verifica tamanho
            const stats = fs.statSync(OUTPUT_FILE);
            console.log(`   📊 Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`   (Agora tente abrir esse ZIP manualmente para ver se os arquivos estão lá!)`);
        } else {
            throw new Error('Corpo da resposta vazio.');
        }

    } catch (error) {
        console.error('\n❌ FALHA NO TESTE:', error.message);
    }
}

testeDownload();