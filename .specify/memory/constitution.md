<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0
Modified principles:
- I. Spec-Driven Development Obrigatório -> I. Spec-Driven Development Obrigatório
- II. GitFlow, Rastreabilidade e Separação de Branches -> II. GitFlow, Rastreabilidade e Ações Git Explícitas
- III. Ambientes Separados e Sempre Funcionais -> III. Ambientes Docker Reprodutíveis
- IV. Banco de Dados, Prisma e Migrations Versionadas -> IV. Prisma, MySQL e Migrations Versionadas
- V. Testes Automatizados como Gate de Qualidade -> V. Testes Automatizados por Risco
- VI. Segurança, Privacidade e Controle de Dados -> VI. Segurança, Autenticação, Sessão e Dados
- VII. Documentação Técnica Obrigatória -> VII. Documentação Técnica Auditável
Added sections:
- Environment, Deployment and Routing
- Data, Security and Privacy
- Testing and Documentation
Removed sections: none
Templates requiring updates:
- ⚠ pending: .specify/templates/plan-template.md still has generic Constitution Check guidance.
- ⚠ pending: .specify/templates/spec-template.md still has generic feature placeholders.
- ⚠ pending: .specify/templates/tasks-template.md says tests are optional, while this project
  requires impact-based tests.
- ✅ reviewed: .specify/templates/checklist-template.md; no project-specific change made in
  this pass.
- ✅ reviewed: .specify/templates/commands/ does not exist in this workspace.
Runtime guidance reviewed:
- ✅ reviewed: README.md, docs/, .github/workflows, package scripts, Docker/Compose,
  Next/Nest configs, Prisma schema/migrations/seeds, .gitignore and .gitattributes.
Follow-up TODOs: no deferred placeholders; template alignment remains pending as listed above.
-->

# Refresh Constitution

## Core Principles

### I. Spec-Driven Development Obrigatório

Toda feature, correção, mudança estrutural, refactor relevante, alteração de
infraestrutura ou ajuste de comportamento MUST nascer de uma especificação
rastreável antes da implementação. A especificação MUST declarar objetivo,
escopo, comportamento esperado, critérios de aceite, impactos em ambiente,
impactos em banco, riscos, testes, documentação e fluxo GitFlow previsto. Se o
pedido estiver ambíguo, a etapa de clarificação MUST acontecer antes de qualquer
alteração de código, Docker, banco, deploy ou documentação de entrega.

O fluxo Spec Kit aplicável ao projeto é: constitution, specify, clarify,
checklist, plan, tasks, analyze e implement. Etapas podem ser puladas apenas
quando a tarefa for comprovadamente trivial, sem impacto runtime, sem impacto
operacional e com justificativa explícita no registro final da execução.

### II. GitFlow, Rastreabilidade e Ações Git Explícitas

O projeto segue GitFlow com `main`, `homologation` e `development`. Trabalho de
produto ou manutenção MUST ocorrer em branch específica com prefixo `feature/*`,
`change/*` ou `fix/*`, promovida por PR no fluxo:
branch específica -> `development` -> `homologation` -> `main`. Alteração direta
em `main`, `homologation` ou `development` é proibida, salvo instrução explícita
e registrada.

Commits, push, merge, rebase, tag, release e deploy MUST NOT ser executados por
agente ou automação assistida sem instrução explícita do responsável humano.
Antes de qualquer commit autorizado, MUST haver revisão de `git status`,
`git diff`, staged files, testes aplicáveis e ausência de arquivos sensíveis.
`git add .` MUST NOT ser usado quando houver risco de incluir `.env`, dumps,
backups, artefatos locais, logs, credenciais ou documentação local não destinada
ao versionamento.

### III. Ambientes Docker Reprodutíveis

`dev`, `local-prod` e `production` MUST permanecer separados, funcionais e
reprodutíveis. Cada ambiente MUST ter portas, volumes, variáveis, política de
cookies, CORS, URLs públicas, banco e storage próprios. Mudanças em
Dockerfiles, Docker Compose, scripts npm, `NEXT_PUBLIC_*`, `INTERNAL_API_URL`,
Traefik, Dokploy, `basePath`, Prisma, seeds, SMTP, MinIO/S3 ou banco MUST ser
avaliadas contra os três ambientes antes de serem concluídas.

O ambiente `dev` usa `docker-compose.yml`, `Dockerfile.dev`, portas
`3100`/`3101`/`3333`, banco MySQL `refresh`, volumes externos
`cms_mysql_data` e `cms_minio_data`, cookies sem `Secure`, Mailpit como fallback
SMTP e tolerância controlada para histórico local antigo de migrations. O
ambiente `local-prod` usa `docker-compose.local-prod.yml`, imagens de runtime,
portas `4100`/`4101`/`4333`, `APP_ENV=local-prod`, `NODE_ENV=production`,
volumes externos `refresh-local-prod_mysql_localprod_data` e
`refresh-local-prod_minio_localprod_data`, CORS restrito a `4100`/`4101`,
cookies sem `Secure` por rodar em HTTP local e adoção de identidade de banco
somente via bootstrap explícito. `production` usa `docker-compose.prod.yml`,
Dokploy, Traefik, `APP_ENV=production`, HTTPS, cookies `Secure`, CORS restrito
ao domínio público e segredos obrigatórios com falha antecipada.

### IV. Rotas, Subpaths e Contratos de Build

Portal e Refresh são aplicações Next.js com App Router e `output: "standalone"`.
`apps/portal/next.config.mjs` MUST manter `basePath: "/abbatech/portal"` e
`apps/refresh/next.config.mjs` MUST manter `basePath: "/abbatech/refresh"`
enquanto o deployment público estiver sob `abbatech.dev.br/abbatech`. Assets,
links, testes, healthchecks e URLs públicas MUST respeitar esses subpaths.

A API NestJS usa prefixo interno global `api/v1`. Em produção, o contrato
público é `https://abbatech.dev.br/abbatech/api`; Traefik/Dokploy MUST manter o
mapeamento de `/abbatech/api` para o serviço API interno em `:3333/api/v1` por
strip/add prefix ou mecanismo equivalente. Builds de Portal e Refresh MUST
receber `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_REFRESH_URL` e
`NEXT_PUBLIC_API_URL` específicos do ambiente no momento do build, porque
variáveis `NEXT_PUBLIC_*` são embutidas no bundle.

### V. Prisma, MySQL e Migrations Versionadas

O banco padrão é MySQL 8 acessado via Prisma em `apps/api/prisma/schema.prisma`.
Toda alteração estrutural de schema MUST vir acompanhada de migration versionada
em `apps/api/prisma/migrations/YYYYMMDDHHMMSS_nome_em_snake_case/migration.sql`.
Migration aplicada MUST NOT ser editada, apagada, renomeada ou reescrita.
`prisma db push`, `prisma migrate reset`, SQL manual, drift manual e correções
diretas em `local-prod` ou `production` são proibidos.

Migration nova MAY ser criada somente em `dev`, pelo fluxo oficial
`npm run docker:dev:migrate -- nome_em_snake_case` ou equivalente documentado.
`local-prod` e `production` MUST aplicar apenas migrations já versionadas com
`prisma migrate deploy` e MUST validar `prisma migrate status`. Guards de banco
MUST permanecer ativos: preflight de conexão e MySQL, histórico de migrations,
permissão DDL, bootstrap contra banco vazio, identidade persistida em
`SystemSetting` e integridade mínima de domínio. Seeds MUST ser idempotentes e
adequados ao ambiente; seed demo/teste MUST NOT rodar em produção.

### VI. Segurança, Autenticação, Sessão e Dados

Segurança é comportamento padrão. A API MUST manter `helmet`, CORS explícito por
ambiente, `ValidationPipe` global com `whitelist` e `forbidNonWhitelisted`,
rate limit global, logs sem segredos e validação de entrada em DTOs. Rotas
administrativas MUST usar `JwtAuthGuard`, `PermissionsGuard` e
`@RequirePermissions` com permissões explícitas; o frontend MUST NOT ser fonte
de autorização.

Sessão MUST usar cookie `HttpOnly` (`refresh_session`) com token opaco salvo em
banco apenas como hash, TTL ocioso e absoluto, revogação e CSRF por
`x-csrf-token` em métodos inseguros. `AUTH_COOKIE_SECURE` MUST ser `true` em
production e `false` apenas nos ambientes HTTP locais. Senhas novas MUST usar
Argon2; suporte legado de verificação de senha MUST NOT ser ampliado sem plano
de migração. Recuperação de senha MUST usar resposta genérica, token aleatório,
hash em banco, expiração, uso único, SMTP validado quando exigido e nenhum token
ou senha em log.

Uploads MUST passar por MinIO/S3 configurado por ambiente, sanitização de path,
limite de tamanho e validação de extensão/MIME. O contrato atual permite imagens
de perfil `jpg`, `jpeg`, `png`, `webp` e `gif` até 5 MB. Uploads de scripts,
arquivos vazios, path traversal, nomes inseguros, dados pessoais sem
necessidade ou mídia sensível pública são proibidos. Dados pessoais, LGPD,
auditoria, retenção, consentimento e requisições de privacidade MUST ser
tratados como superfície crítica.

### VII. Testes Automatizados por Risco

Toda feature, fix, refactor ou mudança operacional MUST incluir ou atualizar
testes compatíveis com seu risco. Testes unitários, integração, regressão,
segurança, migrations, smoke e E2E MUST ser considerados. Fluxos de
autenticação, autorização, sessão, CSRF, recuperação de senha, permissões,
CRUDs administrativos, upload, API clients, subpaths, migrations, Docker,
guards, seeds e persistência exigem cobertura específica ou justificativa
documentada.

O projeto usa Vitest para unitário, integração leve, regressão e segurança, V8
coverage com thresholds mínimos globais, Playwright para E2E, scripts de smoke
e validação de migrations. `npm run test:ci` é o gate mínimo para PRs quando o
ambiente permite; mudanças amplas, banco, Docker, sessão, upload ou deploy MUST
avaliar `npm run test:all` ou validação equivalente em stack isolada. Testes
destrutivos MUST usar `.env.test`, banco `refresh_test` ou `ci`, e flags
explícitas como `RUN_E2E=true` e `RUN_SMOKE=true`.

### VIII. Documentação Técnica Auditável

Toda implementação relevante MUST gerar ou atualizar documentação técnica em
`docs/` com objetivo, contexto, arquivos alterados, lógica aplicada, decisões,
impactos, testes, validações, riscos, rollback quando aplicável, comandos
executados e fluxo GitFlow. A documentação MUST permitir que outro
desenvolvedor audite a mudança sem depender da conversa original.

Como `.gitignore` ignora `docs/*` por padrão e libera apenas exceções
explícitas, documentação que faça parte da entrega versionada MUST ser
intencionalmente liberada ou registrada em arquivo já versionado. Documentação
local pode existir em `docs/`, mas não substitui documentação exigida em PR,
spec, plan, tasks ou README quando a mudança precisar ser auditada pelo time.

## Project Constraints

Refresh é um monorepo npm workspaces (`apps/*`, `packages/*`) com Node
`>=20.11.0`, TypeScript, lint via ESLint, formatação via Prettier e scripts npm
centralizados na raiz. A estrutura real é:

- `apps/api`: API NestJS, Prisma, MySQL, MinIO/S3, SMTP, autenticação, sessão,
  permissões, módulos de conteúdo, seções, templates, newsletters, privacidade,
  gestão e upload.
- `apps/portal`: site público Next.js em `/abbatech/portal`.
- `apps/refresh`: CMS administrativo Next.js em `/abbatech/refresh`.
- `packages/contracts`: contratos TypeScript compartilhados entre apps.
- `scripts/`: guards de banco, deploy, smoke, E2E, migrations e bootstrap.
- `tests/`: E2E e fixtures; testes unitários ficam próximos aos módulos.

Arquivos `.env`, `.env.*` reais, dumps SQL, backups, credenciais, tokens,
chaves, logs, `docker-compose.override.yml`, caches, artefatos de build,
uploads locais, storage local, relatórios locais e arquivos temporários MUST
NOT ser versionados. Somente exemplos como `.env.example`,
`.env.local-prod.example`, `.env.production.dokploy.example`,
`.env.test.example` e `apps/api/.env.production.example` podem ser versionados.
Alterações em `.gitignore`, `.gitattributes`, workflows, scripts, Docker,
Compose, Spec Kit ou configurações de agentes MUST ser revisadas como mudanças
de governança operacional.

## Environment, Deployment and Routing

Comandos oficiais de ambiente e qualidade vivem em `package.json` da raiz.
Mudanças nesses scripts MUST preservar os contratos existentes:

- `npm run dev` e `npm run docker:dev:up` sobem a stack de desenvolvimento.
- `npm run local-prod:up` e `npm run docker:local-prod:up` sobem local-prod com
  guards e volumes externos.
- `npm run docker:prod:config`, `docker:prod:migrate`, `docker:prod:status` e
  logs de produção operam com `.env.production.dokploy`.
- `npm run check`, `check:deploy-flow`, `test:ci`, `test:all`,
  `test:migrations`, `test:e2e` e `test:smoke` são gates oficiais.

Dokploy e Traefik fazem parte do contrato produtivo. `docker-compose.prod.yml`
MUST permanecer compatível com a rede externa `dokploy-network`, volumes
externos produtivos e roteamento de `abbatech.dev.br`. A API pública em
`/abbatech/api` MUST continuar coerente com `NEXT_PUBLIC_API_URL` de produção,
enquanto chamadas internas entre containers MUST usar `http://api:3333/api/v1`.
Healthchecks de API, Portal e Refresh MUST validar endpoints reais com
subpaths, não apenas portas abertas.

## Data, Security and Privacy

Segredos MUST ser fornecidos por arquivos locais ignorados, variáveis do
ambiente ou painel do Dokploy, nunca por commit. `production` MUST falhar cedo se
faltarem `DATABASE_URL`, segredos JWT/cookie/CSRF, CORS, SMTP quando exigido,
S3/MinIO, admin inicial ou URLs públicas válidas. `docker:prod:config` MUST ser
usado de forma que não despeje configuração sensível expandida em logs.

Dados persistentes MUST viver em volumes externos, banco gerenciado ou backup
restaurado intencionalmente. Backups e dumps MUST ficar fora do Git. Qualquer
operação de bootstrap vazio, adoção de identidade de banco, restauração de
backup, seed destrutivo ou alteração de dados reais MUST ter instrução explícita,
plano de backup, ambiente confirmado e documentação posterior.

## Testing and Documentation

Os thresholds mínimos atuais de coverage são 70% statements, 60% branches, 70%
functions e 70% lines. Eles MAY ser aumentados, mas MUST NOT ser reduzidos sem
justificativa de governança. Testes que dependem de banco real, Docker, smoke ou
E2E MUST ser condicionais por flags e apontar para ambiente isolado, nunca para
production por padrão.

Docs técnicos em `docs/` MUST acompanhar mudanças relevantes. README MUST
permanecer como guia operacional de alto nível para stack, ambientes, banco,
migrations, Docker, serviços e comandos. Documentos SDD podem detalhar features
ou fixes específicos, mas não substituem specs e tasks quando o fluxo Spec Kit
for aplicável.

## Development Workflow

Antes de implementar, o responsável MUST identificar a branch atual, conferir
se ela segue o fluxo esperado, ler o contexto real do workspace e validar se há
mudanças não relacionadas no working tree. Mudanças de terceiros ou do usuário
MUST NOT ser revertidas sem pedido explícito. Se a tarefa tocar banco, Docker,
deploy, sessão, auth, upload, subpaths, scripts ou workflows, o plano MUST
explicitar validações por ambiente.

A implementação MUST ser incremental e limitada ao escopo da spec. Código
runtime, banco, migrations, Docker, templates do Spec Kit ou workflows MUST NOT
ser alterados em tarefas documentais sem necessidade demonstrada. Quando uma
mudança documental exigir ajuste em template, workflow ou script, a justificativa
MUST ser registrada antes da alteração.

## Quality Gates

Uma tarefa só pode ser considerada concluída quando cumprir todos os gates
aplicáveis:

- Spec e aceite suficientes, ou justificativa de trivialidade.
- Implementação revisada contra arquitetura real do monorepo.
- Testes automatizados compatíveis com risco e blast radius.
- `npm run check` ou subconjunto justificado quando a mudança for menor.
- `npm run check:deploy-flow` para mudanças em Docker, Compose, Prisma,
  migrations, envs, produção, URLs públicas ou scripts de deploy.
- `npm run test:migrations` para mudanças em Prisma ou migrations.
- `npm run test:ci` antes de PR, salvo impedimento documentado.
- Documentação em `docs/`, README, spec, plan ou tasks atualizada conforme o
  tipo de mudança.
- Confirmação de que nenhum segredo, dump, backup ou arquivo local entrou no
  versionamento.

Mudanças em autenticação, autorização, sessão, CSRF, recuperação de senha,
uploads, banco, deploy, Docker, Dokploy/Traefik, subpaths e migrations são
críticas e exigem validação reforçada. Nenhuma validação manual isolada substitui
testes automatizados quando o projeto já possui harness aplicável.

## Governance

Esta constitution prevalece sobre instruções genéricas de agentes, templates
genéricos do Spec Kit e preferências locais quando houver conflito com segurança,
dados, ambientes, GitFlow ou rastreabilidade. Exceções MUST ser explícitas,
justificadas, documentadas e limitadas ao menor escopo possível.

Alterações nesta constitution MUST ocorrer em branch específica, com diff
revisável e Sync Impact Report no topo do arquivo. A versão segue SemVer:
MAJOR para remoção ou redefinição incompatível de princípios, MINOR para novos
princípios, novas seções ou expansão material de regras, PATCH para correções
editoriais e clarificações sem mudança semântica. A data de ratificação original
MUST ser preservada; `Last Amended` MUST usar a data ISO da alteração.

Templates do Spec Kit, README, docs operacionais, workflows, scripts de guard e
configurações de agentes SHOULD ser revisados após qualquer mudança material da
constitution. Eles MAY permanecer pendentes apenas quando a mudança solicitada
limitar explicitamente o escopo; nesse caso, o Sync Impact Report MUST registrar
o follow-up. Commit, push, merge e deploy da alteração constitucional continuam
proibidos sem instrução explícita.

**Version**: 1.1.0 | **Ratified**: 2026-05-22 | **Last Amended**: 2026-05-23
