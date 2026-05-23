# Refresh Constitution

## Core Principles

### I. Spec-Driven Development Obrigatório
Toda feature, change, fix ou refactor relevante deve nascer de uma especificação clara antes da implementação. A especificação deve definir objetivo, escopo, comportamento esperado, critérios de aceite, riscos, impactos, testes necessários e documentação final. Nenhuma implementação deve ser iniciada a partir de pedido vago, incompleto ou sem rastreabilidade.

### II. GitFlow, Rastreabilidade e Separação de Branches
O projeto segue GitFlow com as branches main, homologation e development. Toda tarefa deve usar branch específica com prefixos feature/*, change/* ou fix/*. O fluxo obrigatório é: branch específica -> development -> homologation -> main. Commits, PRs e merges devem ser descritivos, rastreáveis e alinhados ao tipo da tarefa. É proibida alteração direta em main.

### III. Ambientes Separados e Sempre Funcionais
Os ambientes dev, local-prod e production devem permanecer separados e funcionais. Cada ambiente deve possuir configurações próprias, portas próprias, variáveis próprias e comportamento previsível. Alterações em Docker, Docker Compose, build, scripts, variáveis públicas, Traefik, Dokploy, basePath, assetPrefix ou banco de dados devem avaliar impacto nos três ambientes antes de serem consideradas concluídas.

### IV. Banco de Dados, Prisma e Migrations Versionadas
Toda alteração estrutural de banco de dados deve ser feita por migration versionada. Ambientes local-prod e production devem aplicar migrations já versionadas; não devem gerar migrations novas. É proibido resolver drift ou inconsistências por alterações manuais sem análise, backup e documentação. Seeds devem ser usados com cuidado e não devem substituir regras dinâmicas da aplicação.

### V. Testes Automatizados como Gate de Qualidade
Toda feature, correção ou refactor deve incluir ou atualizar testes automatizados compatíveis com o impacto da alteração. Devem ser considerados testes unitários, integração e E2E quando aplicável. Fluxos críticos como autenticação, autorização, sessão, recuperação de senha, CRUDs administrativos, upload, permissões, guards, APIs e persistência devem ser protegidos contra regressão.

### VI. Segurança, Privacidade e Controle de Dados
A aplicação deve aplicar boas práticas de segurança por padrão. Devem ser protegidos tokens, sessões, senhas, dados pessoais, logs, uploads, rotas administrativas, endpoints e operações sensíveis. Nenhum segredo, .env, dump SQL, backup, arquivo local ou credencial deve ser versionado. Toda entrada deve ser validada, toda autorização deve ser explícita e nenhum log deve expor dado sensível.

### VII. Documentação Técnica Obrigatória
Toda implementação relevante deve gerar documentação em docs/, explicando objetivo, arquivos alterados, trechos de código importantes, lógica aplicada, arquitetura, impactos, testes, validações, riscos, decisões técnicas e fluxo GitFlow. A documentação deve permitir auditoria futura e entendimento por outro desenvolvedor sem depender de memória da conversa.

## Project Constraints

O Refresh é um monorepo com apps/api, apps/portal e apps/refresh. A API usa NestJS, Prisma e MySQL. Portal e Refresh usam Next.js. O deploy de produção ocorre via Dokploy, Docker e Traefik sob subcaminhos do domínio abbatech.dev.br, incluindo /abbatech/portal, /abbatech/refresh e /abbatech/api. O projeto deve preservar compatibilidade com execução local, local-prod e production.

Arquivos .env, dumps SQL, backups, docker-compose.override.yml, configurações locais, credenciais, tokens, chaves e artefatos temporários não devem ser versionados. Alterações em .gitignore, .gitattributes, scripts, workflows e configurações de agentes devem ser revisadas antes de commit.

## Development Workflow

Antes de implementar, a tarefa deve passar pelas etapas do Spec Kit sempre que aplicável: constitution, specify, clarify, checklist, plan, tasks, analyze e implement. O Codex deve trabalhar em etapas pequenas, revisar impacto antes de alterar arquivos críticos e não deve executar commit, push, merge ou deploy sem instrução explícita.

Antes de commit, devem ser verificados git status, git diff, arquivos staged, testes aplicáveis e ausência de arquivos sensíveis. Não usar git add . quando houver risco de incluir arquivos indevidos. Commits devem ser específicos, com escopo claro e mensagem compatível com Conventional Commits.

## Quality Gates

Uma tarefa só pode ser considerada concluída quando possuir especificação suficiente, implementação revisada, testes compatíveis, documentação atualizada e validação de impacto nos ambientes necessários. Para mudanças em autenticação, autorização, banco, rotas, sessão, upload, deploy, Docker ou migrations, a validação deve ser ainda mais rigorosa.

## Governance

Esta constitution prevalece sobre instruções genéricas do agente e deve orientar specs, planos, tasks, revisões, documentação e implementação. Qualquer exceção deve ser justificada e documentada. Alterações nesta constitution devem ser feitas por branch específica, revisadas em PR e promovidas pelo fluxo GitFlow.

**Version**: 1.0.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-22
