const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const API_URL = 'http://localhost:3000/api';
const OUTPUT_FILE = path.join(__dirname, 'download_com_link.zip');

const USER = { email: "teste_123@fatec.sp.gov.br", password: "senha_super_secreta" };

async function testeFluxoLinks() {
    console.log('\n🔗 TESTE DE LINKS + ZIP MISTO...\n');

    try {
        // 1. LOGIN
        const resLogin = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(USER)
        });
        const { token } = await resLogin.json();
        console.log('✅ Logado.');

        // 2. RECUPERA A ÚLTIMA PASTA (Do teste anterior)
        const resList = await fetch(`${API_URL}/folders/my-folders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listData = await resList.json();
        const folderId = listData.folders[0].id;
        console.log(`📂 Usando pasta ID: ${folderId}`);

        // 3. ADICIONA UM LINK DO YOUTUBE
        console.log('3. Adicionando Link do YouTube...');
        const resLink = await fetch(`${API_URL}/links/add`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                folderId: folderId,
                title: 'Apresentação Final - Grupo 1',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            })
        });
        const linkData = await resLink.json();
        if(resLink.ok) console.log('✅ Link salvo:', linkData.document.name);
        else console.error('❌ Erro no link:', linkData);

        // 4. BAIXA O ZIP PARA CONFERIR
        console.log('\n4. Baixando ZIP Misto...');
        const resDownload = await fetch(`${API_URL}/downloads/folder/${folderId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const fileWriter = fs.createWriteStream(OUTPUT_FILE);
        await pipeline(resDownload.body, fileWriter);

        console.log(`✅ ZIP salvo em: ${OUTPUT_FILE}`);
        console.log('➡️  Abra o ZIP e procure pelo arquivo "Apresentação Final - Grupo 1.url"');

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

testeFluxoLinks();