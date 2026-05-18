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

Por padrão, o dev usa Mailpit para capturar e-mails em `http://localhost:8025`. Para testar envio real, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE` e `SMTP_FROM` no `.env`; o Compose repassa esses valores para a API. Não commite credenciais reais.

## Bancos e volumes em local-prod/production

`local-prod` e `production` também usam dados persistentes obrigatórios. O Compose não deve criar volumes de banco automaticamente nesses ambientes.

- `docker-compose.local-prod.yml` usa volumes externos fixos: `refresh-local-prod_mysql_localprod_data` e `refresh-local-prod_minio_localprod_data`.
- `docker-compose.prod.yml` usa volumes externos fixos do app no Dokploy: `portal-abbatech-refresh-g4ud9u_mysql_prod_data` e `portal-abbatech-refresh-g4ud9u_minio_prod_data`. `MYSQL_DATA_VOLUME` e `MINIO_DATA_VOLUME` continuam disponíveis apenas como override manual, se o nome real do volume for diferente.
- A API executa `scripts/guard-database-bootstrap.mjs` antes de `prisma migrate deploy` e seed. Se o banco não tiver `_prisma_migrations` ou estiver sem usuários, o start é bloqueado.
- A API executa `scripts/guard-production-config.mjs` antes do boot produtivo. Em production, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` e, para SMTP autenticado como Gmail, `SMTP_USER` e `SMTP_PASSWORD` precisam estar cadastrados no ambiente do Dokploy.
- Para uma primeira instalação realmente intencional, defina `ALLOW_EMPTY_DATABASE_BOOTSTRAP=true` somente durante esse bootstrap inicial, com backup/restore ou criação de dados planejada. Depois volte para `false`.

Dados não ficam dentro da imagem Docker nem no repositório: eles precisam estar em volume externo existente, banco gerenciado ou backup restaurado antes do deploy.

## Atualizar schema
```bash
docker compose exec api npm run prisma:migrate -w @abbatech/api
docker compose exec api npm run prisma:seed -w @abbatech/api
```

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
