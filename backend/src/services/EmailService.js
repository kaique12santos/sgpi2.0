const nodemailer = require('nodemailer');

require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: true, // true para 465, false para outras portas
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_PASSWORD,
            },
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
}

module.exports = new EmailService();