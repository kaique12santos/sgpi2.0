const UserRepository = require('../repositories/UserRepository.js');

class AdminUserController {

    /**
     * Lista todos os usuários.
     */
    async index(req, res) {
        try {
            const users = await UserRepository.findAll();
            return res.json(users);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar usuários.' });
        }
    }

    /**
     * Atualiza um usuário.
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, email, role } = req.body;

            // Validação básica
            if (!name || !email || !role) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
            }

            await UserRepository.update(id, { name, email, role });
            
            return res.json({ success: true, message: 'Usuário atualizado.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
        }
    }

    /**
     * Deleta um usuário.
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const requestingUserId = req.userId; // ID de quem está pedindo (vem do token)

            // Bloqueio de segurança: Não pode se deletar
            if (parseInt(id) === requestingUserId) {
                return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
            }

            await UserRepository.delete(id);
            
            return res.json({ success: true, message: 'Usuário removido.' });

        } catch (error) {
            console.error(error);
            // Verifica erro de chave estrangeira (se o usuário tiver pastas)
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ error: 'Não é possível excluir: Este usuário possui pastas/entregas vinculadas.' });
            }
            return res.status(500).json({ error: 'Erro ao deletar usuário.' });
        }
    }
}

module.exports = new AdminUserController();