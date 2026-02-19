const Database = require('../config/Database.js');
const bcrypt = require('bcryptjs');
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
    async create(user) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const sql = `INSERT INTO users (name, email, password_hash, role, is_verified, verification_token, reset_expires) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const result = await Database.query(sql, [user.name, user.email, hashedPassword, user.role, user.is_verified, user.verification_token, user.reset_expires]);
        return result.insertId;
    }

    /**
     * Atualiza campos específicos do usuário.
     * @param {number} id - ID do usuário a ser atualizado.
     * @param {Object} fields - Campos a serem atualizados.
     * @returns {Promise<void>}
     */
    async update(id, fields) {
        const keys = Object.keys(fields);
        const values = Object.values(fields);
        
        if (keys.length === 0) return;

        const setClause = keys.map(key => {
            if (key === 'password') return `password_hash = ?`; // <--- TRADUÇÃO
            return `${key} = ?`;
        }).join(', ');
        const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
        
        await Database.query(sql, [...values, id]);
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
        
        return rows[0];
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

    /**
     * Lista todos os usuários do sistema (para o painel ADMIN).
     * IMPORTANTE: Não retornamos a senha!
     */
    async findAll() {
        const sql = `
            SELECT id, name, email, role, created_at 
            FROM users 
            ORDER BY name ASC
        `;
        return await Database.query(sql);
    }

    /**
     * Atualiza dados de um usuário específico (Admin editando alguém).
     */
    async update(id, { name, email, role }) {
        const sql = `
            UPDATE users 
            SET name = ?, email = ?, role = ? 
            WHERE id = ?
        `;
        await Database.query(sql, [name, email, role, id]);
        return this.findById(id);
    }

    /**
     * Deleta um usuário.
     */
    async delete(id) {
        const sql = `DELETE FROM users WHERE id = ?`;
        await Database.query(sql, [id]);
    }
}

module.exports = new UserRepository();