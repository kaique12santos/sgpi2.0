const SystemRepository = require('../repositories/SystemRepository');

class SystemController {

    // Público - Todos podem ver
    async getMessage(req, res) {
        try {
            const message = await SystemRepository.getMessage();
            return res.json(message);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar avisos.' });
        }
    }

    // Privado - Apenas coordenador pode editar
    async updateMessage(req, res) {
        try {
            const { content, type, is_active } = req.body;
            if (!content) return res.status(400).json({ error: 'Conteúdo obrigatório.' });

            const updated = await SystemRepository.updateMessage({ content, type, is_active });
            return res.json({ success: true, message: 'Aviso atualizado!', data: updated });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar aviso.' });
        }
    }
}

module.exports = new SystemController();