# Abbatech

Plataforma em monorepo com:

- `portal`: site publico em Next.js
- `refresh`: CMS em Next.js
- `api`: backend em NestJS
- `mysql`: persistencia principal
- `minio`: storage de arquivos
- `mailpit`: ambiente local para emails

## Principios aplicados

- TypeScript em toda a stack
- Tailwind CSS no front
- Separacao explicita entre portal, CMS e API
- Controles iniciais de seguranca: `helmet`, CORS restrito, validacao global, rate limit, JWT, auditoria
- Base de LGPD: consentimento, politica de retencao, trilha de auditoria, minimizacao de dados e segregacao de midia

## Estrutura

```text
abbatech/
  apps/
    api/
    portal/
    refresh/
  packages/
    contracts/
  docker-compose.yml
  docker-compose.prod.yml
  dokploy.yaml
```

## Subida local

```bash
cp .env.example .env
npm run dev
```

O ambiente de desenvolvimento é full Docker: o Compose sobe MySQL, MinIO, Mailpit, API, Portal e Refresh. As aplicações rodam em modo watch dentro dos containers, com o código local montado em volume.

Os volumes de dados do MySQL e MinIO são externos e obrigatórios: `cms_mysql_data` e `cms_minio_data`. Isso impede que o Compose crie um banco vazio silenciosamente por troca de nome de volume.

Em uma máquina nova, inicialize os volumes de forma explícita:

```bash
npm run dev:init-volumes
npm run dev
```

Se você espera reaproveitar dados existentes, não rode `dev:init-volumes`; anexe/restaure o volume correto antes de subir o ambiente.

Se precisar rodar as aplicações diretamente no host para depuração pontual, use `npm install` e `npm run dev:host`, ajustando `DATABASE_URL` e `SMTP_HOST` para `localhost`.

Por padrão, dev e local-prod usam Mailpit como fallback quando não há SMTP no respectivo env. Se `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` e `SMTP_FROM` estiverem configurados em `.env` ou `.env.local-prod`, a API usa esse SMTP real para recuperação de senha. Não commite credenciais reais.

## Padrao de ambientes

Antes de buildar ou subir ambientes produtivos, rode:

```bash
npm run check:deploy-flow
```

Esse guard valida a estrutura de migrations, a ordem Prisma Client -> build -> guard de banco -> `prisma migrate deploy`, os argumentos publicos do Next e as diferencas obrigatorias entre dev, local-prod e production.

- `dev` usa `http://localhost:3333/api/v1`, cookies sem `Secure` e volumes externos `cms_mysql_data`/`cms_minio_data`.
- `dev` usa o SMTP do `.env` quando configurado, Mailpit como fallback, e tolera marcadores antigos de rollback em `_prisma_migrations` apenas como aviso, para não bloquear bootstrap local.
- `local-prod` usa `http://localhost:4333/api/v1`, cookies sem `Secure` por rodar em HTTP local, CORS restrito a `4100` e `4101`, e nao herda `NEXT_PUBLIC_*` do `.env` de dev no build.
- `local-prod` e `production` bloqueiam migration parcial ou marcada como rollback.
- `local-prod` e `production` não adotam identidade de banco ausente por padrão. A primeira adoção em local-prod precisa passar por `npm run local-prod:bootstrap`.
- `production` usa `https://abbatech.dev.br/abbatech/api`, cookies `HttpOnly` com `Secure` por padrao, CORS restrito ao dominio publico e falha cedo quando segredos obrigatorios estao ausentes. `AUTH_CSRF_SECRET` deve ser configurado em novas instalacoes; deploys existentes podem usar fallback controlado para `COOKIE_SECRET`.
- A API executa preflight de banco antes das migrations, verifica `prisma migrate status` depois delas, valida a identidade persistida do banco e confere dados essenciais do dominio antes de iniciar.
- A API aguarda MySQL saudavel pelo Compose e ainda faz retry de conexao no preflight (`DB_CONNECT_RETRIES` e `DB_CONNECT_RETRY_DELAY_MS`).

Para subir local-prod pelo caminho padronizado:

```bash
npm run local-prod:up
```

Em maquina nova, crie explicitamente os volumes antes:

```bash
npm run local-prod:init-volumes
npm run local-prod:up
```

## Operacao Docker

```bash
npm run docker:dev:up
npm run docker:dev:migrate -- nome_da_migration
npm run docker:dev:generate
npm run docker:dev:status
npm run docker:dev:seed
npm run docker:dev:test

npm run docker:local-prod:up
npm run docker:local-prod:migrate
npm run docker:local-prod:generate
npm run docker:local-prod:status
npm run docker:local-prod:seed
npm run docker:local-prod:test

npm run docker:prod:config
npm run docker:prod:migrate
npm run docker:prod:generate
npm run docker:prod:status
```

`docker:dev:migrate` cria migration nova e exige nome em `snake_case`, por exemplo `npm run docker:dev:migrate -- add_customer_status`. `local-prod` e `production` nunca criam migration nova; eles aplicam migrations versionadas com `migrate deploy`.

`docker:dev:test` e `docker:local-prod:test` rodam em services Docker isolados, com volumes proprios de `node_modules` e artefatos de build, para não alterar as dependencias dos containers de runtime/watch.

## Bancos e volumes em local-prod/production

`local-prod` e `production` também usam dados persistentes obrigatórios. O Compose não deve criar volumes de banco automaticamente nesses ambientes.

- `docker-compose.local-prod.yml` usa volumes externos fixos: `refresh-local-prod_mysql_localprod_data` e `refresh-local-prod_minio_localprod_data`.
- `docker-compose.prod.yml` usa volumes externos fixos do app no Dokploy: `portal-abbatech-refresh-g4ud9u_mysql_prod_data` e `portal-abbatech-refresh-g4ud9u_minio_prod_data`. `MYSQL_DATA_VOLUME` e `MINIO_DATA_VOLUME` continuam disponíveis apenas como override manual, se o nome real do volume for diferente.
- A API executa `scripts/guard-database-bootstrap.mjs` antes de `prisma migrate deploy` e seed. Se o banco não tiver `_prisma_migrations` ou estiver sem usuários, o start é bloqueado.
- A API executa `scripts/guard-production-config.mjs` antes do boot produtivo. Em production, variaveis de banco, cookie, CSRF, CORS, S3, SMTP e admin inicial precisam estar cadastradas no ambiente do deploy.
- Para uma primeira instalação realmente intencional em local-prod, use `npm run local-prod:bootstrap`. Esse script habilita temporariamente `ALLOW_EMPTY_DATABASE_BOOTSTRAP=true` e `ALLOW_DATABASE_IDENTITY_ADOPTION=true` apenas para o bootstrap. Depois o start normal volta a bloquear adoção implícita.
- Em production, defina `ALLOW_EMPTY_DATABASE_BOOTSTRAP=true` e `ALLOW_DATABASE_IDENTITY_ADOPTION=true` somente de forma explícita, temporária e acompanhada de plano de dados/backup.

Dados não ficam dentro da imagem Docker nem no repositório: eles precisam estar em volume externo existente, banco gerenciado ou backup restaurado antes do deploy.

## Atualizar schema
```bash
npm run db:generate
npm run db:preflight
npm run db:migrate
npm run db:status
npm run db:identity
npm run db:seed
npm run db:integrity
```

Toda alteracao em `apps/api/prisma/schema.prisma` deve acompanhar uma migration versionada em `apps/api/prisma/migrations/YYYYMMDDHHMMSS_nome_da_mudanca/migration.sql`. Nao altere banco manualmente fora do fluxo de migrations.

## Guardrails de banco

O start da API e os scripts de banco cobrem os seguintes riscos:

- Volume ou banco errado: `EXPECTED_DATABASE_ENVIRONMENT`, `EXPECTED_DATABASE_NAME` e identidade persistida em `SystemSetting`.
- `.env` errado: `guard-production-config.mjs` valida variaveis obrigatorias e URLs publicas.
- Migration parcial: `guard-database-preflight.mjs` bloqueia `_prisma_migrations` com migration sem `finished_at` ou marcada como rollback.
- Migration pendente apos deploy: `prisma migrate status` roda depois de `prisma migrate deploy`.
- MySQL divergente: `MYSQL_REQUIRED_MAJOR=8` bloqueia versao major diferente e MariaDB por padrao.
- Permissao insuficiente para migrations: `CHECK_DATABASE_DDL_PERMISSIONS=true` executa uma checagem DDL temporaria.
- Backup/restauracao de outro ambiente: `guard-database-identity.mjs` compara a identidade gravada no banco com o ambiente esperado.
- Dado legado inconsistente: `guard-domain-data-integrity.mjs` exige usuarios, papeis, Administrador ativo, permissoes e menus essenciais.

Em local-prod e production, `ALLOW_DATABASE_IDENTITY_ADOPTION` fica `false` por padrao. Se for a primeira instalacao da identidade em um banco correto ja existente, revise o banco, rode uma unica vez pelo caminho de bootstrap explícito e volte para o start normal.

## Servicos:
- Portal: `http://localhost:3100/abbatech/portal`
- Refresh CMS: `http://localhost:3101/abbatech/refresh`
- API: `http://localhost:3333/api/v1`
- Mailpit: `http://localhost:8025`
- MinIO Console: `http://localhost:9001`

## Acesso inicial

- Refresh CMS: `http://localhost:3101`
- E-mail inicial: `admin@abbatech.local`
- Senha inicial: `Refresh123!`

Ao subir o dev, a API aplica as migrations e executa o seed inicial automaticamente. Em `local-prod` e `production`, essa etapa só prossegue se o banco existente passar pela guarda de bootstrap.

## Qualidade

```bash
npm run typecheck
npm run lint
npm run test
npm run check
```

O repositório possui esteira local e CI para `typecheck`, lint, testes e build.

## Escopo atual

- Monorepo pronto para evolucao
- API modular baseada no dominio da plataforma
- Portal e CMS com App Router e Tailwind
- Schema inicial com suporte a secoes, conteudos, templates, SEO, usuarios, papeis, newsletter e auditoria
- Infra local e produtiva com Docker Compose e artefato de Dokploy

## Observacoes

- O projeto esta organizado para evolucao incremental com separacao clara entre portal, CMS e API.
- O schema prioriza governanca, seguranca e consistencia operacional.
