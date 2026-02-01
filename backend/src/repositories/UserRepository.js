const Database = require('../config/Database.js');
/**
 * Repositório responsável pelas operações de banco de dados da tabela 'users'.
 * Segue o padrão de isolamento de dados (Data Access Layer).
 */
class UserRepository {
    
    /**
     * Cria um novo usuário no banco de dados.
     * @param {Object} dados - Objeto contendo os dados do usuário.
     * @param {string} dados.name - Nome completo.
     * @param {string} dados.email - E-mail institucional.
     * @param {string} dados.password_hash - Senha já criptografada (hash).
     * @param {string} dados.role - Papel do usuário ('professor' ou 'coordenador').
     * @returns {Promise<number>} Retorna o ID do usuário recém-criado.
     */
    async create({ name, email, password_hash, role }) {
        const sql = `
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        `;
        
        // Database.query retorna [rows, fields], mas para INSERT no mysql2,
        // o resultado (rows) contém informações como insertId.
        const result = await Database.query(sql, [name, email, password_hash, role]);
        return result.insertId;
    }

    /**
     * Busca um usuário pelo e-mail.
     * Utilizado principalmente no processo de Login.
     * @param {string} email - O e-mail a ser buscado.
     * @returns {Promise<Object|null>} Retorna o objeto do usuário ou null se não encontrar.
     */
    async findByEmail(email) {
        const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
        const rows = await Database.query(sql, [email]);
        
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Busca um usuário pelo ID.
     * Utilizado para validar o token JWT ou buscar perfil.
     * @param {number} id - O ID do usuário.
     * @returns {Promise<Object|null>} Retorna o objeto do usuário ou null se não encontrar.
     */
    async findById(id) {
        const sql = `SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1`;
        const rows = await Database.query(sql, [id]);
        
        return rows.length > 0 ? rows[0] : null;
    }
}

module.exports = new UserRepository();