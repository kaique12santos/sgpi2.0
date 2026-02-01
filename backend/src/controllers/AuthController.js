const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');

/**
 * Controller responsável pela autenticação e gestão de identidade.
 */
class AuthController {

    /**
     * Realiza o login do usuário.
     * 1. Busca usuário pelo email.
     * 2. Compara a senha enviada com o hash do banco.
     * 3. Gera um Token JWT se tudo estiver correto.
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Validação básica
            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
            }

            // 2. Busca no banco
            const user = await UserRepository.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }

            // 3. Verifica senha (Bcrypt)
            const senhaBate = await bcrypt.compare(password, user.password_hash);
            if (!senhaBate) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }

            // 4. Gera o Token JWT
            const token = jwt.sign(
                { id: user.id, role: user.role, name: user.name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            // 5. Retorna sucesso (Sem mandar a senha de volta!)
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Erro no Login:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }

    /**
     * Registra um novo usuário (Útil para criar o primeiro coordenador).
     */
    async register(req, res) {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
            }

            // Verifica se já existe
            const existe = await UserRepository.findByEmail(email);
            if (existe) {
                return res.status(400).json({ error: 'Email já cadastrado.' });
            }

            // Criptografa a senha antes de salvar
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            // Salva no banco
            const newId = await UserRepository.create({
                name,
                email,
                password_hash,
                role: role || 'professor' // Padrão é professor se não informar
            });

            return res.status(201).json({ success: true, message: 'Usuário criado!', userId: newId });

        } catch (error) {
            console.error('Erro no Registro:', error);
            return res.status(500).json({ error: 'Erro ao registrar usuário.' });
        }
    }
}

module.exports = new AuthController();