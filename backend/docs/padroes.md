# Padrões de Projeto e Código

## 1. Padrões de Projeto (Design Patterns)
Utilizamos os seguintes padrões para garantir escalabilidade:

- **Singleton:** Utilizado na classe `Database` para garantir uma única pool de conexões com o banco.
- **Repository Pattern:** Para abstrair a camada de persistência. O Controller não sabe que existe SQL.
- **Strategy Pattern (Planejado):** Para o armazenamento de arquivos (permitindo troca futura entre Google Drive, S3 ou Local).

## 2. Padrões de Código (Coding Standards)

### Comentários (JSDoc)
Todas as funções exportadas, classes e métodos complexos devem possuir documentação JSDoc.
**Formato:**
```javascript
/**
 * Descrição curta do que a função faz.
 * Regra: Detalhe importante sobre o comportamento (ex: validações).
 * @param {Tipo} nomeParametro - Descrição do parâmetro.
 * @returns {Tipo} Descrição do retorno.
 */
```

### 3. Padrões de Nomenclatura e Arquivos
## [10/02/2026] 
- **Sanitização:** Todos os nomes de arquivos devem ser sanitizados para remover acentos e espaços antes da persistência.
- **Links Externos:** Devem ser prefixados como `link_github_[timestamp].html` ou `link_youtube_[timestamp].html`.
- **Worker:** O Worker é a única entidade autorizada a mudar o status de um documento para `COMPLETED`.