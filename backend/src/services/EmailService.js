const nodemailer = require('nodemailer');

require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
            tls:{
                rejectUnauthorized: false,
                ciphers:'SSLv3'
            },
            connectionTimeout: 5000, // 5 segundos
            greetingTimeout: 5000  
        });
    }

    async sendVerificationCode(toEmail, code) {
        try {
            const info = await this.transporter.sendMail({
                from: `"SGPI Fatec" <${process.env.MAIL_USER}>`,
                to: toEmail,
                subject: "Código de Verificação - SGPI",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Bem-vindo ao SGPI!</h2>
                        <p>Para ativar sua conta, use o código abaixo:</p>
                        <h1 style="color: #2c3e50; letter-spacing: 5px;">${code}</h1>
                        <p>Se você não solicitou este cadastro, ignore este e-mail.</p>
                    </div>
                `,
            });
            console.log(`📧 E-mail enviado para ${toEmail}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail:', error);
            return false;
        }
    }

    async sendPasswordReset(toEmail, code) {
        try {
            const info = await this.transporter.sendMail({
                from: `"SGPI Fatec" <${process.env.MAIL_USER}>`,
                to: toEmail,
                subject: "Recuperação de Senha - SGPI",
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Esqueceu sua senha?</h2>
                        <p>Sem problemas. Use o código abaixo para redefinir:</p>
                        <h1 style="color: #c0392b; letter-spacing: 5px;">${code}</h1>
                        <p>Este código expira em 1 hora.</p>
                        <p>Se você não pediu isso, troque sua senha imediatamente.</p>
                    </div>
                `,
            });
            console.log(`📧 E-mail de Reset enviado para ${toEmail}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar e-mail de reset:', error);
            return false;
        }
    }
}

module.exports = new EmailService();