---
name: mcp-shield
description: "Proteção, blindagem e auto-recuperação de configurações do MCP (Model Context Protocol). Garante que conexões remotas (Supabase) e locais (Playwright) mantenham credenciais e headers válidos, impedindo erros de 'Unauthorized' em inicializações e atualizações."
when_to_use: "Quando o MCP falhar com erro Unauthorized, antes ou após atualizar o AG Kit/plugins, ou ao inspecionar a integridade de ferramentas MCP."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
version: 1.0.0
---

# MCP Shield & Auto-Healing

> Blindagem de alta integridade para servidores MCP no Antigravity IDE, Cursor e CLI. Previne e elimina falhas de autorização (`Unauthorized on initialize`).

---

## 1. Causa Raiz do Erro "Unauthorized"

Ao inicializar o Antigravity IDE ou recarregar as extensões MCP, o Language Server tenta conectar aos servidores listados em `~/.gemini/config/mcp_config.json`.

Quando o servidor `supabase` é declarado apenas com:
```json
"supabase": {
  "serverUrl": "https://mcp.supabase.com/mcp"
}
```
O servidor remoto oficial da Supabase rejeita a mensagem JSON-RPC `initialize` com código HTTP **401 Unauthorized** porque não foram fornecidos:
1. O parâmetro de consulta `?project_ref=<PROJECT_REF>`
2. O cabeçalho HTTP `Authorization: Bearer <SUPABASE_PERSONAL_ACCESS_TOKEN>`

---

## 2. As 3 Regras Invioláveis de Blindagem (Shield Invariants)

1. **Zero Naked Remote (Proibido URL Nua):**
   - Sob nenhuma hipótese o endpoint `https://mcp.supabase.com/mcp` pode ser salvo sem query param `project_ref` e o objeto `headers` contendo `Authorization`.
   
2. **Env Credential Anchoring (Ancoragem em .env):**
   - O Personal Access Token (`sbp_...`) e o Project Ref devem residir no arquivo `.env` do workspace (protegido pelo `.gitignore`).
   - Arquivos versionados no Git (`.agents/mcp_config.json`) utilizam referências ou comandos locais, mantendo o repositório seguro sem risco de vazamento de chaves.

3. **Verificação & Auto-Cura Pré/Pós-Atualização (Auto-Healing):**
   - Antes ou depois de qualquer `sync-mcp`, atualização do AG Kit ou novo deploy, o script de validação deve ser executado para garantir que o arquivo `~/.gemini/config/mcp_config.json` não foi revertido para valores sem autenticação.

---

## 3. Estrutura Canônica Correta

### No Antigravity IDE (`~/.gemini/config/mcp_config.json`)
```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=vljftyhuzylljrgppmve",
      "headers": {
        "Authorization": "Bearer <SUPABASE_PERSONAL_ACCESS_TOKEN>"
      }
    },
    "playwright": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@executeautomation/playwright-mcp-server"
      ]
    }
  }
}
```

### No Cursor (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=vljftyhuzylljrgppmve",
      "headers": {
        "Authorization": "Bearer <SUPABASE_PERSONAL_ACCESS_TOKEN>"
      }
    }
  }
}
```

---

## 4. Comandos de Diagnóstico e Auto-Reparo

O utilitário de blindagem está localizado em `.agents/skills/mcp-shield/scripts/guard-mcp.mjs`.

### Diagnosticar Integridade:
```bash
node .agents/skills/mcp-shield/scripts/guard-mcp.mjs --check
```

### Auto-Reparo Instantâneo (Restaura Credenciais de .env ou .cursor):
```bash
node .agents/skills/mcp-shield/scripts/guard-mcp.mjs --repair
```

Se qualquer atualização sobrescrever o arquivo global, o comando `--repair` restaura os cabeçalhos em menos de 1 segundo sem necessidade de intervenção manual.
