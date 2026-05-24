# Quickstart: Plano tecnico da portabilidade ICHC

Este quickstart descreve validacoes e guardas da feature. A primeira fatia ja foi implementada e validada; comandos abaixo devem ser lidos como historico da primeira fatia e guia para fases futuras.

**Status atual**: primeira fatia T007-T032 e T064-T065 concluida e validada. Fases futuras nao estao autorizadas por este quickstart; qualquer nova implementacao, migration, seed, banco, Docker, script, workflow, commit, push, merge ou deploy exige pedido explicito e subfatia menor.

## Guardas antes de fases futuras

1. DP-001 resolvida por excecao formal humana: manter `refactor/business-rules` somente para esta feature/rodada.
2. Blockers humanos resolvidos documentalmente: multi-secao fica backlog/future spec; permissao granular oficial `contents.publish`; `FriendlyUrl` dedicada aprovada; migration somente em dev pelo fluxo oficial.
3. Nao executar o `tasks.md` completo como fila automatica. Definir subfatia pequena ou nova spec antes de qualquer fase futura.
4. Revisar status/diff do workspace, confirmar working tree sem alteracoes alheias e garantir que nenhuma credencial, SMTP, caminho absoluto, SQL, PHP, HTML, CSS, JS ou asset legado sera copiado.

## Validacao em dev

Para fases futuras autorizadas:

```powershell
npm run typecheck
npm run lint
npm run test:api
npm run test:portal
npm run test:refresh
npm run test:migrations
```

### Validacoes executadas na T032

Na conclusao da primeira fatia T007-T032 e T064-T065, os comandos abaixo foram executados nesta rodada:

```powershell
npm run typecheck
npm run test:portal
npm run test:refresh
npm run test:api
npm run test:migrations
```

Resultados:

- `npm run typecheck`: passou em API, Portal e Refresh.
- `npm run test:portal`: passou com 1 arquivo e 5 testes.
- `npm run test:refresh`: passou com 7 arquivos e 45 testes.
- `npm run test:api`: passou com 11 arquivos e 93 testes; o log SMTP offline pertence a teste controlado de auth.
- `npm run test:migrations`: passou; deploy em banco de teste foi pulado por ausencia de `RUN_TEST_DATABASE=true`, conforme comportamento esperado do script.

Gates posteriores informados manualmente: `npm run lint` e `npm run test:ci` passaram; `test:e2e` foi pulado de forma controlada por ausencia de `RUN_E2E=true` e stack local de teste nao iniciada.

Se houver migration futura, criar apenas em dev pelo fluxo oficial:

```powershell
npm run docker:dev:migrate -- nome_em_snake_case
```

Proibido usar comandos Prisma destrutivos ou fora do fluxo oficial, incluindo `prisma db push`, `prisma migrate reset`, SQL manual e correcoes diretas em local-prod/production.

## Validacao de banco de teste

Quando houver migration/backfill:

```powershell
$env:RUN_TEST_DATABASE="true"
npm run test:migrations
```

O banco deve ser `test` ou `ci`. Nunca apontar para production.

## Validacao local-prod

Depois de aprovadas as migrations versionadas e sem criar schema novo em local-prod:

```powershell
npm run docker:local-prod:build
npm run docker:local-prod:up
npm run docker:local-prod:status
```

Smoke nao destrutivo:

```powershell
$env:RUN_SMOKE="true"
npm run test:smoke
```

Validar:

- API em `http://localhost:4333/api/v1`.
- Portal em `http://localhost:4100/abbatech/portal`.
- Refresh em `http://localhost:4101/abbatech/refresh`.
- Cookies sem `Secure` apenas por HTTP local.
- Nenhum seed demo/teste em dados reais.

## Checklist futuro antes de production

- Branch e PR seguem GitFlow aprovado.
- Production nao executa criacao de migration, `prisma db push`, `prisma migrate reset`, SQL manual ou correcao direta.
- `npm run test:ci` passou.
- `npm run test:all` ou validacao equivalente foi avaliada se a mudanca tocar banco/auth/permissao/portal.
- `npm run check:deploy-flow` passou quando aplicavel.
- `npm run test:migrations` passou.
- Migrations revisadas e versionadas.
- Production aplica apenas migrations versionadas ja criadas em dev por fluxo apropriado de deploy/migrate.
- Backfill idempotente revisado.
- Rollback documentado.
- `npm run docker:prod:config` validado sem vazar segredo.
- Smoke nao destrutivo planejado.
- Nenhum `.env` real, dump, backup, log, credencial ou configuracao legada no versionamento.

## Cenarios minimos de aceite da primeira fatia

1. Usuario com status diferente de `Ativo` nao autentica.
2. Usuario sem permissao granular nao publica conteudo.
3. Conteudo `draft` nao aparece no portal.
4. Conteudo `archived` nao aparece no portal.
5. Conteudo `published` com validade ativa fora do intervalo nao aparece.
6. Conteudo `published` sem validade ativa aparece.
7. URL duplicada entre secao e conteudo e rejeitada.
8. Detalhe publico por URL nao vaza conteudo nao publicado.
9. Menu publico respeita hierarquia, ordem, visibilidade e politica.
10. SEO especifico prevalece; fallback usa titulo/secao.
11. Auditoria registra mudancas criticas sem segredo.

## Proibicoes permanentes nesta feature

- Nao copiar codigo, SQL, HTML, CSS, JS, assets ou estrutura fisica do legado.
- Nao migrar credenciais, SMTP, IPs, e-mails especificos ou paths absolutos.
- Nao criar CMS paralelo.
- Nao implementar newsletter ou ouvidoria sem decisao formal.
- Nao alterar production sem instrucao explicita.
