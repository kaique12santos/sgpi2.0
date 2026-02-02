const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const EmailService = require('../services/EmailService');

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

            if (!user.is_verified) {
                return res.status(403).json({ 
                    error: 'Conta não verificada. Cheque seu e-mail ou solicite novo código.' 
                });
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
        const { name, email, password, role } = req.body;

        try {
            const userExists = await UserRepository.findByEmail(email);
            if (userExists) {
                return res.status(400).json({ error: 'Email já cadastrado.' });
            }

            // Gera código de 6 dígitos
            const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

            const newUser = { 
                name, 
                email, 
                password, 
                role: role || 'professor',
                is_verified: 0, // Nasce bloqueado
                verification_token: verificationToken
            };

            const userId = await UserRepository.create(newUser);

            // Tenta enviar o e-mail
            const emailSent = await EmailService.sendVerificationCode(email, verificationToken);

            if (!emailSent) {
                // Se o e-mail falhar, deletamos o usuário para ele tentar de novo?
                // Ou avisamos para ele pedir reenvio. Vamos avisar.
                return res.status(201).json({
                    success: true,
                    userId,
                    warning: 'Usuário criado, mas falha ao enviar e-mail. Peça o reenvio.'
                });
            }

            return res.status(201).json({ 
                success: true, 
                userId,
                message: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.'
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao registrar usuário.' });
        }
    }

    async verifyEmail(req, res) {
        const { email, code } = req.body;

        try {
            const user = await UserRepository.findByEmail(email);
            
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
            if (user.is_verified) return res.status(400).json({ error: 'Conta já verificada.' });

            if (user.verification_token !== code) {
                return res.status(400).json({ error: 'Código inválido.' });
            }

            // Código Correto: Ativa o usuário e limpa o token
            await UserRepository.update(user.id, { is_verified: 1, verification_token: null });

            return res.json({ success: true, message: 'Conta verificada com sucesso! Faça login.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
        }
    }
}

module.exports = new AuthController();