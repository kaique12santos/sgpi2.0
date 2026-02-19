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

            if (!email || !password) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
            }

            const user = await UserRepository.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Credenciais inválidas.' });
            }

            if (!user.is_verified) {
                return res.status(403).json({
                    error: 'Conta não verificada. Cheque seu e-mail ou solicite novo código.'
                });
            }

            const senhaBate = await bcrypt.compare(password, user.password_hash);
            if (!senhaBate) {
                return res.status(401).json({ error: 'Senha Incorreta' });
            }

            const token = jwt.sign(
                { id: user.id, role: user.role, name: user.name },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

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
     *  Realiza o registro do usuário.
     *  1. Verifica se o email já existe.
     *  2. Se existir e não estiver verificado, atualiza os dados e reenvia código.
     *  3. Se existir e estiver verificado, retorna erro.
     *  4. Se não existir, cria usuário, gera código e envia email.
     */
    async register(req, res) {
        const { name, email, password, role } = req.body;

        try {
            const userExists = await UserRepository.findByEmail(email);

            const passwordHash = await bcrypt.hash(password, 8);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const tokenExpiration = new Date(Date.now() + 3600000); // 1 hora

            if (userExists) {
                if (userExists.is_verified) {
                    return res.status(400).json({ error: 'Este e-mail já está cadastrado e ativo.' });
                }

                await UserRepository.update(userExists.id, {
                    name: name,
                    password: passwordHash,
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

            await UserRepository.create({
                name,
                email,
                password: passwordHash,
                role: role || 'professor',
                is_verified: false,
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

    /**
     *  Reenvia o código de verificação para o email do usuário.
     *  1. Verifica se o usuário existe.
     *  2. Verifica se já está verificado (se sim, retorna erro).
     *  3. Gera novo código, atualiza no banco e envia email.
     */
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

    /**
     * Verifica o código de verificação enviado pelo usuário.
     *  1. Verifica se o usuário existe.
     *  2. Verifica se já está verificado (se sim, retorna erro).
     *  3. Compara o código enviado com o que está no banco.
     *  4. Se bater, marca como verificado e remove o token.
     */
    async verifyEmail(req, res) {
        const { email, code } = req.body;

        try {
            const user = await UserRepository.findByEmail(email);

            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
            if (user.is_verified) return res.status(400).json({ error: 'Conta já verificada.' });

            if (user.verification_token !== code) {
                return res.status(400).json({ error: 'Código inválido.' });
            }

            await UserRepository.update(user.id, { is_verified: 1, verification_token: null });

            return res.json({ success: true, message: 'Conta verificada com sucesso! Faça login.' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao verificar e-mail.' });
        }
    }

    /**
     * Reenvia o código de verificação para o email do usuário.
     *  1. Verifica se o usuário existe.
     *  2. Verifica se já está verificado (se sim, retorna erro).
     *  3. Gera novo código, atualiza no banco e envia email.
     */
    async resendVerification(req, res) {
        const { email } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
            if (user.is_verified) return res.status(400).json({ error: 'Esta conta já está verificada.' });

            const newToken = Math.floor(100000 + Math.random() * 900000).toString();

            await UserRepository.update(user.id, { verification_token: newToken });

            await EmailService.sendVerificationCode(email, newToken);

            return res.json({ success: true, message: 'Novo código de verificação enviado.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao reenviar código.' });
        }
    }

    /**
     * Inicia o processo de recuperação de senha.
     *  1. Verifica se o usuário existe.
     *  2. Gera um código de recuperação e salva no banco com expiração.
     *  3. Envia o código para o email do usuário.
     */
    async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

            const resetToken = Math.floor(100000 + Math.random() * 900000).toString();


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

    /**
     * Realiza a troca de senha utilizando o código de recuperação.
     *  1. Verifica se o usuário existe.
     *  2. Compara o código enviado com o que está no banco.
     *  3. Verifica se o código não expirou.
     *  4. Se tudo estiver correto, atualiza a senha e remove o token de recuperação.
     */
    async resetPassword(req, res) {
        const { email, code, newPassword } = req.body;
        try {
            const user = await UserRepository.findByEmail(email);
            if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });


            if (user.reset_token !== code) {
                return res.status(400).json({ error: 'Código inválido.' });
            }

            const now = new Date();
            if (now > new Date(user.reset_expires)) {
                return res.status(400).json({ error: 'Código expirado. Solicite novamente.' });
            }

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