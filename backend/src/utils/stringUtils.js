/**
 * Remove acentos, caracteres especiais e espaços de uma string.
 * Ex: "Relatório de Gestão.pdf" -> "Relatorio_de_Gestao.pdf"
 * Ex: "Atenção! 🚀" -> "Atencao"
 */
function sanitizeFilename(filename) {
    if (!filename) return '';

    // Separa a extensão para não estragar (ex: .pdf)
    const parts = filename.split('.');
    const ext = parts.length > 1 ? '.' + parts.pop() : '';
    const name = parts.join('.');

    // Remove acentos e caracteres especiais
    const cleanName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_-]/g, '');

    return cleanName + ext;
}
module.exports = { sanitizeFilename };