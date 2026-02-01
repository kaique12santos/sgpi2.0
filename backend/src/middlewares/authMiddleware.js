const jwt = require('jsonwebtoken');

/**
 * Middleware para proteger rotas privadas.
 * Verifica se o Header 'Authorization' contém um token JWT válido.
 */
function authMiddleware(req, res, next) {
    // 1. Busca o token no header (Padrão: "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido.' });
    }

    // Separa "Bearer" do token em si
    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro no formato do token.' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformatado.' });
    }

    // 2. Verifica a validade do token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Injeta o ID e Role do usuário na requisição
        // Isso permite que os Controllers saibam QUEM está logado
        req.userId = decoded.id;
        req.userRole = decoded.role;

        return next(); // Pode passar para o próximo passo (Controller)

    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
}

module.exports = authMiddleware;