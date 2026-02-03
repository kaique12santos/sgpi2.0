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
                return res.status(401).json({ error: 'Senha Incorreta' });
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

            // Criptografa a senha nova
            const passwordHash = await bcrypt.hash(password, 8);
            // Gera novo token
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const tokenExpiration = new Date(Date.now() + 3600000); // 1 hora

            if (userExists) {
                // CENÁRIO 1: Conta Real (Já validada) -> Bloqueia
                if (userExists.is_verified) {
                    return res.status(400).json({ error: 'Este e-mail já está cadastrado e ativo.' });
                }

                // CENÁRIO 2: Conta Fantasma (Nunca validou) -> Recicla/Sobrescreve
                // Isso resolve o problema de "ficar preso" no cadastro
                await UserRepository.update(userExists.id, {
                    name: name,
                    password: passwordHash, // Atualiza para a senha nova que ele acabou de digitar
                    verification_token: verificationCode,
                    reset_expires: tokenExpiration,
                    role: role || 'professor'
                });

                await EmailService.sendVerificationCode(email, verificationCode);

                return res.status(200).json({ 
                    message: 'Cadastro pendente atualizado. Novo código enviado.',
                    email: email 
                });
            }

            // CENÁRIO 3: Usuário Novo -> Cria
            await UserRepository.create({
                name,
                email,
                password: passwordHash,
                role: role || 'professor',
                is_verified: false, // Entra como 0 (Pendente)
                verification_token: verificationCode,
                reset_expires: tokenExpiration
            });

            await EmailService.sendVerificationCode(email, verificationCode);

            return res.status(201).json({ message: 'Usuário criado. Verifique seu email.' });

        } catch (error) {
            console.error('Erro no registro:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }

    // REENVIAR CÓDIGO DE VERIFICAÇÃO (Item 2)
    async resendVerification(req, res) {
        const { email } = req.body;

        try {
            const user = await UserRepository.findByEmail(email);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            if (user.is_verified) {
                return res.status(400).json({ error: 'Esta conta já está verificada. Faça login.' });
            }

            // Gera novo token
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const tokenExpiration = new Date(Date.now() + 3600000);

            await UserRepository.update(user.id, {
                verification_token: verificationCode,
                reset_expires: tokenExpiration
            });

            await EmailService.sendVerificationCode(email, verificationCode);

            return res.json({ message: 'Novo código enviado.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao reenviar código.' });
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

    // REENVIAR CÓDIGO DE VERIFICAÇÃO (Item 2)
    async resendVerification(req, res) {
        const { email } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
            if (user.is_verified) return res.status(400).json({ error: 'Esta conta já está verificada.' });

            // Gera novo código
            const newToken = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Atualiza no banco
            await UserRepository.update(user.id, { verification_token: newToken });

            // Envia e-mail
            await EmailService.sendVerificationCode(email, newToken);

            return res.json({ success: true, message: 'Novo código de verificação enviado.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao reenviar código.' });
        }
    }

    // ESQUECI A SENHA (Item 3 - Parte A)
    async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            // Gera token de reset
            const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Define validade (Agora + 1 hora)
            // MySQL espera formato 'YYYY-MM-DD HH:MM:SS' ou objeto Date do JS
            const expires = new Date(Date.now() + 3600000); // 1 hora em milissegundos

            await UserRepository.update(user.id, { 
                reset_token: resetToken,
                reset_expires: expires 
            });

            await EmailService.sendPasswordReset(email, resetToken);

            return res.json({ success: true, message: 'Código de recuperação enviado para seu e-mail.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao processar recuperação de senha.' });
        }
    }

    // RESETAR SENHA (Item 3 - Parte B)
    async resetPassword(req, res) {
        const { email, code, newPassword } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            // Validações
            if (user.reset_token !== code) {
                return res.status(400).json({ error: 'Código inválido.' });
            }

            const now = new Date();
            // Verifica se o token expirou (Comparação de datas)
            if (now > new Date(user.reset_expires)) {
                return res.status(400).json({ error: 'Código expirado. Solicite novamente.' });
            }

            // Tudo certo: Atualiza senha e limpa tokens
            // OBS: UserRepository.update não faz hash automático (o create faz).
            // Precisamos hashear a senha aqui ou atualizar o repository. 
            // Vamos hashear aqui para ser rápido:
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await UserRepository.update(user.id, {
                password_hash: hashedPassword,
                reset_token: null,
                reset_expires: null
            });

            return res.json({ success: true, message: 'Senha alterada com sucesso! Faça login.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao resetar senha.' });
        }
    }
}

module.exports = new AuthController();