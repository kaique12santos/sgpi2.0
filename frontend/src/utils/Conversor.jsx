// Função Auxiliar: Cria um arquivo .html que redireciona para o link
    const addLinkAsFile = () => {
        const link = form.values.link;
        
        // 1. Validação simples
        if (!link) return;
        if (!link.startsWith('http')) {
            return form.setFieldError('link', 'O link deve começar com http:// ou https://');
        }

        // 2. Cria o conteúdo do arquivo (Um HTML simples de redirecionamento)
        const fileContent = `
            <html>
                <head>
                    <meta http-equiv="refresh" content="0; url=${link}" />
                    <script>window.location.href = "${link}";</script>
                </head>
                <body>
                    <p>Abrindo link externo: <a href="${link}">${link}</a></p>
                </body>
            </html>
        `;

        // 3. Transforma em um objeto File (Blob)
        const blob = new Blob([fileContent], { type: 'text/html' });
        
        // Gera um nome de arquivo amigável (ex: github_projeto.html)
        // Pega o domínio ou o final da URL para usar de nome
        let fileName = 'link_externo.html';
        try {
            const urlObj = new URL(link);
            const domain = urlObj.hostname.replace('www.', '').split('.')[0]; // ex: github
            fileName = `link_${domain}_${Date.now()}.html`;
        } catch (e) { /* fallback */ }

        const file = new File([blob], fileName, { type: 'text/html' });

        // 4. Adiciona na fila de arquivos (mesmo estado do Dropzone!)
        setFiles((current) => [...current, file]);

        // 5. Limpa o campo e avisa
        form.setFieldValue('link', '');
        notifications.show({ title: 'Link Adicionado', message: 'O link foi convertido em arquivo e está na fila.', color: 'blue' });
    };

