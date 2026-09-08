# Memory Index

## Project
- [project] Toda alteração finalizada deve ser commitada e enviada (git push) diretamente para o repositório remoto.
- [project] OBRIGATÓRIO: Antes de qualquer commit ou push, executar o build de produção (`npm run build`) para validar que não há erros de sintaxe ou de importação, assegurando 100% de sucesso no deploy do Vercel.
- [project] MCP SHIELD: Conexões remotas MCP (Supabase em `mcp.supabase.com`) NUNCA devem ser configuradas sem `headers.Authorization` (Bearer token) e parâmetro `project_ref`. Utilizar a skill `@mcp-shield` (`guard-mcp.mjs --repair`) para blindagem contra erros 'Unauthorized on initialize' em qualquer atualização.
- [project] Always create a new dedicated branch for major code changes → project-conventions.md
- [project] AG Kit only supports Gemini CLI and Google Antigravity (not other AI coding tools) → project-conventions.md
- [project] Component metadata uses SemVer while toolkit releases use CalVer → tech-decisions.md
