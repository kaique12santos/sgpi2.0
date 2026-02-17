const Database = require('../config/Database');

class SystemRepository {

    /**
     *  Busca o aviso do sistema (id=1)
     * @returns {Promise<{id: number, content: string, type: string, is_active: boolean}>}
     */
    async getMessage() {
        const sql = `SELECT * FROM system_messages WHERE id = 1`;
        const rows = await Database.query(sql);
        return rows[0];
    }

    /**
     *  Atualiza o aviso do sistema (id=1)
     * @param {Object} param0 - Dados do aviso a ser atualizado
     * @param {string} param0.content - Conteúdo do aviso
     * @param {string} param0.type - Tipo do aviso (ex: "info", "warning", "error")
     * @param {boolean} param0.is_active - Se o aviso está ativo ou não
     * @returns {Promise<{id: number, content: string, type: string, is_active: boolean}>}
     */
    async updateMessage({ content, type, is_active }) {
        const sql = `
            UPDATE system_messages 
            SET content = ?, type = ?, is_active = ?
            WHERE id = 1
        `;
        await Database.query(sql, [content, type, is_active]);
        return this.getMessage();
    }
}

module.exports = new SystemRepository();