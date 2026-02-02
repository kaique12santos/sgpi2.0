const DocumentRepository = require('../repositories/DocumentRepository');

class LinkController {

    /**
     * Adiciona um link de referência (YouTube, Docs, etc) ao pacote.
     */
    async addLink(req, res) {
        try {
            const { folderId, title, url } = req.body;

            if (!folderId || !title || !url) {
                return res.status(400).json({ error: 'Pasta, Título e URL são obrigatórios.' });
            }

            // Validação simples de URL
            if (!url.startsWith('http')) {
                return res.status(400).json({ error: 'A URL deve começar com http:// ou https://' });
            }

            // Garante que o nome termine com extensão de atalho para organização
            const fileName = title.endsWith('.url') ? title : `${title}.url`;

            const docId = await DocumentRepository.createLink({
                folder_id: folderId,
                title: fileName,
                url: url
            });

            return res.status(201).json({
                success: true,
                message: 'Link adicionado com sucesso!',
                document: { id: docId, name: fileName, type: 'link' }
            });

        } catch (error) {
            console.error('Erro ao salvar link:', error);
            return res.status(500).json({ error: 'Erro interno ao salvar link.' });
        }
    }
}

module.exports = new LinkController();