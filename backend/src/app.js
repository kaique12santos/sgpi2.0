const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const folderRoutes = require('./routes/folderRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const linkRoutes = require('./routes/linkRoutes');
const managementRoutes = require('./routes/managementRoutes');
const metadataRoutes = require('./routes/metadataRoutes');
const setupRoutes = require('./routes/setupRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
// Importação das Rotas (Futuro)
// const authRoutes = require('./routes/authRoutes');

/**
 * Classe principal da Aplicação Express.
 * Responsável por configurar middlewares, rotas e configurações do servidor.
 * Segue o princípio de Separation of Concerns, tirando essa lógica do server.js.
 */
class App {
    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
    }

    /**
     * Configura os middlewares globais da aplicação.
     * Inclui segurança (Helmet), CORS e parsers de JSON.
     */
    middlewares() {
        this.app.use(cors());
        this.app.use(helmet());
        
        // Configuração para aceitar JSON e uploads maiores
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));

        // Pasta estática para arquivos públicos (se necessário)
        this.app.use('/public', express.static(path.resolve(__dirname, '..', 'public')));
    }

    /**
     * Registra as rotas da API.
     * Define os endpoints principais e de verificação de saúde.
     */
    routes() {
        // Rota de Health Check (Monitoramento)
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'SGPI 2.0 (GED) Online 🚀', 
                timestamp: new Date(),
                mode: process.env.NODE_ENV || 'development'
            });
        });

        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/folders', folderRoutes);
        this.app.use('/api/uploads', uploadRoutes);
        this.app.use('/api/downloads', downloadRoutes);
        this.app.use('/api/links', linkRoutes);
        this.app.use('/api/management', managementRoutes);
        this.app.use('/api/metadata', metadataRoutes);
        this.app.use('/api/setup', setupRoutes);
        this.app.use('/api/submission-folders', submissionRoutes);
        this.app.use('/api/dashboard', dashboardRoutes);


    }
}

module.exports = new App().app;