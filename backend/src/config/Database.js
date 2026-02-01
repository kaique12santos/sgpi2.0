const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
    constructor() {
        if (!Database.instance) {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || 'root',
                database: process.env.DB_NAME || 'sgpi_v2',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            console.log('🔌 Pool de conexões MySQL iniciada.');
            Database.instance = this;
        }
        return Database.instance;
    }

    async getConnection() {
        return await this.pool.getConnection();
    }
    
    async query(sql, params) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }
}

// Exporta uma instância única (Singleton)
module.exports = new Database();