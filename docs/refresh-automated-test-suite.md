# Suíte Automatizada de Testes e Regressão do Refresh

## Objetivo

Esta implementação cria a base automatizada de testes do monorepo Refresh para reduzir regressões e tornar `npm run test:ci` a validação rápida de PR e `npm run test:all` a validação completa com ambiente real isolado.

A suíte cobre camadas unitárias, integração leve, regressão, segurança funcional, validação de migrations, smoke tests e base E2E com Playwright. Os testes destrutivos ou dependentes de serviços externos foram protegidos por flags e por banco isolado de teste.

## Auditoria Inicial

Estado encontrado antes das alterações:

| Área | Estado encontrado | Decisão |
| --- | --- | --- |
| Test runner | Vitest já configurado na raiz | Consolidar Vitest para unitário, integração leve, regressão e segurança |
| Coverage | V8 coverage já instalado, sem thresholds | Configurar thresholds mínimos globais |
| API | NestJS, Prisma, MySQL, testes unitários existentes | Manter testes com Vitest e mocks de dependências |
| Refresh | Next.js com testes manuais via React DOM/JSDOM | Expandir testes existentes sem introduzir Testing Library |
| Portal | Next.js com teste do client de API | Expandir cobertura de erro |
| E2E | Não havia Playwright/Cypress | Adicionar Playwright como ferramenta E2E |
| Banco | Prisma migrations versionadas | Criar validação segura de migrations |
| CI | `.github/workflows/ci.yml` com lint/typecheck/test/build | Centralizar validação em `test:ci` e criar workflow específico |
| Env | `.env` real existe localmente, exemplos versionados | Criar `.env.test.example`; não versionar `.env` real |

## Ferramentas Adotadas

- Vitest: testes unitários, integração leve, regressão e segurança.
- V8 coverage: cobertura com thresholds mínimos.
- Playwright: testes E2E e regressões de fluxo de usuário.
- Prisma CLI: validação estática de schema e migrations.
- Docker Compose: stack isolada opcional para ambiente de teste.

Não foram adicionados Jest, Cypress, Supertest, Testing Library ou MSW porque o projeto já tinha Vitest e testes React renderizados por `react-dom/client`. A prioridade foi consolidar a ferramenta existente.

## Scripts

Scripts principais da raiz:

```bash
npm run test
npm run test:all
npm run test:unit
npm run test:integration
npm run test:regression
npm run test:security
npm run test:coverage
npm run test:migrations
npm run test:e2e
npm run test:smoke
npm run test:api
npm run test:refresh
npm run test:portal
npm run test:ci
```

`npm run test:ci` executa:

1. guarda de fluxo de deploy;
2. lint;
3. typecheck;
4. coverage com thresholds;
5. integração;
6. regressão;
7. migrations;
8. build;
9. E2E, quando `RUN_E2E=true`.

Os E2E são condicionais por segurança. Sem `RUN_E2E=true`, o comando informa o skip e retorna sucesso. Isso evita que o CI tente usar ambiente incompleto ou produção por acidente.

## Comando Unico Para Rodar Tudo

Para rodar a validação completa com banco real isolado, Docker, seed, smoke e E2E:

```bash
npm run test:all
```

No PowerShell é o mesmo comando:

```powershell
npm run test:all
```

Esse comando faz:

1. carrega `.env.test`;
2. instala o navegador Chromium do Playwright, se necessário;
3. sobe `docker-compose.test.yml` com MySQL, MinIO, Mailpit, API, Refresh e Portal;
4. espera API, Refresh e Portal responderem;
5. roda migrations no banco isolado `refresh_test`;
6. roda `seed:test`;
7. roda `test:ci` com `RUN_TEST_DATABASE=true` e `RUN_E2E=true`;
8. roda smoke tests reais;
9. derruba a stack de teste com volumes ao final.

Opções úteis:

```bash
npm run test:all -- --keep-stack
npm run test:all -- --skip-playwright-install
npm run test:all -- --dry-run
npm run test:all -- --help
```

Use `--keep-stack` quando quiser inspecionar os containers depois de uma falha. Sem essa opção, o script limpa tudo no final.

`npm run dev` não deve executar essa suíte completa. `dev` é para desenvolvimento diário e usa ambiente de desenvolvimento. `test:all` é o comando destrutivo controlado para teste completo em ambiente isolado.

## Coverage

Threshold inicial configurado em `vitest.config.ts`:

| Métrica | Threshold |
| --- | ---: |
| Statements | 70% |
| Branches | 60% |
| Functions | 70% |
| Lines | 70% |

Resultado local após a implementação:

| Métrica | Resultado |
| --- | ---: |
| Statements | 82.68% |
| Branches | 71.47% |
| Functions | 92.10% |
| Lines | 85.02% |

O foco não é inflar cobertura numérica. Os testes adicionados protegem comportamento: sessão, permissões, usuários excluídos, upload, recuperação de senha, API client e navegação.

## Estrutura Criada

Arquivos e diretórios novos:

```txt
.env.test.example
docker-compose.test.yml
playwright.config.ts
scripts/
  run-e2e-if-enabled.mjs
  run-smoke-tests.mjs
  test-migrations.mjs
tests/e2e/refresh/
  auth-regression.spec.ts
docs/
  refresh-automated-test-suite.md
```

Testes adicionados ou expandidos:

```txt
apps/api/src/modules/auth/jwt-auth.guard.security.test.ts
apps/api/src/modules/auth/permissions.guard.test.ts
apps/api/src/modules/auth/auth.service.test.ts
apps/api/src/modules/management/management.bootstrap.integration.test.ts
apps/api/src/modules/management/management-users.service.test.ts
apps/api/src/modules/upload/upload.service.security.test.ts
apps/refresh/app/RefreshPageClient.test.tsx
apps/refresh/app/_lib/api.test.ts
apps/refresh/app/_lib/assets.test.ts
apps/refresh/app/_lib/session.regression.test.ts
apps/refresh/app/_lib/utils.test.ts
apps/portal/lib/api.test.ts
```

## Banco de Teste

Arquivo criado:

```txt
.env.test.example
.env.test
```

`.env.test.example` é versionado como contrato. `.env.test` é local, ignorado pelo Git e criado com valores fictícios seguros para a máquina de desenvolvimento.

Os scripts de teste carregam `.env.test` automaticamente quando ele existe, sem sobrescrever variáveis já definidas no ambiente. Isso permite customizar portas, banco e flags no terminal ou no CI.

Ele define valores para:

- banco `refresh_test`;
- segredos de autenticação de teste;
- SMTP local de teste;
- MinIO de teste;
- URLs locais;
- credenciais administrativas fictícias.

Regras aplicadas:

- não usar `.env` real em testes versionados;
- não usar banco de produção;
- não usar dumps SQL;
- não versionar dado sensível;
- banco de teste deve ter nome contendo `test` ou `ci` para validação real de migrations.

Para recriar o arquivo local:

```bash
cp .env.test.example .env.test
```

No PowerShell:

```powershell
Copy-Item .env.test.example .env.test
```

## Migrations

Script criado:

```txt
scripts/test-migrations.mjs
```

O script faz duas etapas:

1. validação estática obrigatória:
   - existência de `schema.prisma`;
   - existência de `apps/api/prisma/migrations`;
   - padrão `YYYYMMDDHHMMSS_snake_case`;
   - presença e conteúdo de `migration.sql`;
   - `prisma validate`.

2. validação real opcional:
   - se `RUN_TEST_DATABASE=true` e `TEST_DATABASE_URL` ou `TEST_MIGRATIONS_DATABASE_URL` existir, roda `prisma migrate deploy`;
   - recusa banco cujo nome não contenha `test` ou `ci`, salvo override explícito.

Exemplo:

```bash
npm run test:migrations
```

Com banco real isolado:

```bash
RUN_TEST_DATABASE=true TEST_DATABASE_URL=mysql://refresh_test:refresh_test@localhost:3308/refresh_test npm run test:migrations
```

No PowerShell:

```powershell
$env:RUN_TEST_DATABASE="true"
$env:TEST_DATABASE_URL="mysql://refresh_test:refresh_test@localhost:3308/refresh_test"
npm run test:migrations
```

## Seeds de Teste

Arquivo criado:

```txt
apps/api/prisma/seed-test.ts
```

Comando:

```bash
npm run seed:test
```

O seed de teste carrega `.env.test`, executa o bootstrap essencial e cria dados determinísticos:

| Usuário | Finalidade |
| --- | --- |
| `ADMIN_EMAIL` | Administrador com permissões administrativas |
| `TEST_COMMON_EMAIL` | Usuário comum/editor para fluxos permitidos |
| `TEST_NO_PERMISSION_EMAIL` | Usuário ativo sem permissões para testes de bloqueio |
| `TEST_DELETED_EMAIL` | Usuário com status `Excluído` para regressão de listagem |

As senhas são fictícias, vêm de `.env.test` e não devem representar dados reais.

## Fixtures e Helpers

Arquivos criados:

```txt
tests/fixtures/refresh-auth-fixtures.ts
tests/setup/load-test-env.ts
scripts/load-test-env.mjs
```

`tests/setup/load-test-env.ts` carrega `.env.test` nos testes Vitest.

`scripts/load-test-env.mjs` é usado pelos scripts Node (`test:migrations`, `test:e2e`, `test:smoke`) para manter o mesmo comportamento local.

`tests/fixtures/refresh-auth-fixtures.ts` centraliza usuários e bootstrap fake usados pelos E2E Playwright.

## Ambiente E2E Local

Arquivo criado:

```txt
docker-compose.test.yml
```

Serviços:

- `mysql-test`;
- `minio-test`;
- `mailpit-test`;
- `api-test`;
- `refresh-test`;
- `portal-test`.

Comandos:

```bash
npm run docker:test:up
npm run docker:test:logs
npm run docker:test:down
```

Para rodar Playwright localmente:

```bash
npx playwright install chromium
RUN_E2E=true npm run test:e2e
```

No PowerShell:

```powershell
$env:RUN_E2E="true"
npm run test:e2e
```

O Playwright também pode subir o Refresh automaticamente:

```powershell
$env:RUN_E2E="true"
$env:PLAYWRIGHT_START_REFRESH="true"
npm run test:e2e
```

## Smoke Tests

Script criado:

```txt
scripts/run-smoke-tests.mjs
```

Por padrão, smoke tests são seguros e condicionais:

```bash
npm run test:smoke
```

Sem `RUN_SMOKE=true`, o script apenas informa skip. Com serviços rodando:

```powershell
$env:RUN_SMOKE="true"
npm run test:smoke
```

URLs padrão:

- `http://localhost:3333/api/v1/health`;
- `http://localhost:3101/abbatech/refresh`;
- `http://localhost:3100/abbatech/portal`.

Também é possível informar:

```powershell
$env:SMOKE_URLS="http://localhost:3333/api/v1/health,http://localhost:3101/abbatech/refresh"
```

## Testes Implementados

| Funcionalidade | Tipo | Arquivo | Status | Observação |
| --- | --- | --- | --- | --- |
| Login sem vazamento de hash | Segurança/unitário | `apps/api/src/modules/auth/auth.service.test.ts` | Coberto | Verifica usuário retornado sem `passwordHash`/`tokenHash` |
| Usuário inativo/excluído no login | Segurança/unitário | `apps/api/src/modules/auth/auth.service.test.ts` | Coberto | Bloqueia antes de criar sessão |
| Sessão opaca e CSRF | Unitário | `apps/api/src/modules/auth/auth-session.service.test.ts` | Coberto | Já existia e permanece |
| Guard de autenticação | Segurança | `apps/api/src/modules/auth/jwt-auth.guard.security.test.ts` | Coberto | Valida cookie de sessão e CSRF |
| Guard de permissões | Unitário | `apps/api/src/modules/auth/permissions.guard.test.ts` | Coberto | Sem usuário, sem permissão, com permissão |
| Recuperação de senha | Unitário | `apps/api/src/modules/auth/auth.service.test.ts` | Coberto | Token hash, expiração, uso único |
| Usuários excluídos fora da listagem | Integração leve | `apps/api/src/modules/management/management.bootstrap.integration.test.ts` | Coberto | Garante filtro `status not Excluído` |
| CRUD de usuário - criação/update/delete | Unitário | `apps/api/src/modules/management/management-users.service.test.ts` | Coberto | Normalização, hash, exclusão lógica/física |
| Upload seguro | Segurança | `apps/api/src/modules/upload/upload.service.security.test.ts` | Coberto | MIME/extensão, vazio, traversal, URL pública |
| Primeiro acesso sem token | UI/regressão | `apps/refresh/app/RefreshPageClient.test.tsx` | Coberto | Sem alerta indevido |
| Sessão realmente expirada | UI/regressão | `apps/refresh/app/RefreshPageClient.test.tsx` | Coberto | Alerta customizado e limpeza de storage |
| Redirect pós-login admin | UI/regressão | `apps/refresh/app/RefreshPageClient.test.tsx` | Coberto | Preserva rota em reload |
| Dropdown por clique | UI/regressão | `apps/refresh/app/_components/RefreshShell.test.tsx` | Coberto | Ignora hover |
| API client Refresh | Unitário | `apps/refresh/app/_lib/api.test.ts` | Coberto | CSRF, timeout, erro, fallback seguro |
| Navegação e permissões no Refresh | Unitário/regressão | `apps/refresh/app/_lib/utils.test.ts` | Coberto | Menus, permissões, navegação |
| Regressão de sessão | Regressão | `apps/refresh/app/_lib/session.regression.test.ts` | Coberto | Storage, reload e navegação inválida |
| Assets sob subpath | Unitário | `apps/refresh/app/_lib/assets.test.ts` | Coberto | Evita path duplicado |
| Portal API client | Unitário | `apps/portal/lib/api.test.ts` | Coberto | Sucesso e erro |
| E2E autenticação Refresh | E2E | `tests/e2e/refresh/auth-regression.spec.ts` | Estruturado | Roda com `RUN_E2E=true` |
| Smoke local | Smoke | `scripts/run-smoke-tests.mjs` | Estruturado | Roda com `RUN_SMOKE=true` |
| Migrations | Infra/teste | `scripts/test-migrations.mjs` | Coberto | Deploy real condicionado a banco test/ci |

## Alteração de Segurança em Upload

Arquivo alterado:

```txt
apps/api/src/modules/upload/upload.service.ts
```

O serviço agora:

- rejeita arquivo vazio;
- rejeita arquivo acima de 5 MB;
- aceita apenas `jpg`, `jpeg`, `png`, `webp` e `gif`;
- exige correspondência entre extensão e MIME type;
- rejeita segmentos de path com `..`;
- rejeita username vazio após sanitização.

Essa mudança impede path traversal e upload de scripts ou formatos não esperados para foto de perfil.

## Explicação dos Scripts Criados

### `scripts/run-e2e-if-enabled.mjs`

Centraliza a decisão de rodar ou pular Playwright. O script só executa quando `RUN_E2E=true`. Isso permite que `test:ci` seja seguro em CI básico, mas rode E2E completo em ambiente preparado.

### `scripts/test-migrations.mjs`

Valida migrations sem tocar banco por padrão. Quando recebe `TEST_DATABASE_URL`, valida `migrate deploy` em banco isolado e recusa nomes perigosos.

### `scripts/run-smoke-tests.mjs`

Executa checks HTTP rápidos quando `RUN_SMOKE=true`. É seguro para local-prod e produção apenas quando apontado para rotas não destrutivas.

## CI e GitFlow

Arquivos alterados/criados:

```txt
.github/workflows/ci.yml
.github/workflows/refresh-tests.yml
```

O workflow `Refresh Automated Tests` roda em:

- pull request para `development`;
- pull request para `homologation`;
- pull request para `main`;
- push em `change/**`, `feature/**` e `fix/**`.

Fluxo sugerido:

```txt
change/review-unit-and-integration-tests-across-applications -> development -> homologation -> main
```

Commit sugerido:

```txt
test(refresh): implementa suíte automatizada de testes e regressão
```

## Padrão para Bugs Futuros

Todo bug corrigido deve seguir:

1. reproduzir o comportamento quebrado;
2. criar teste que falha antes da correção;
3. corrigir o bug;
4. confirmar que o teste passa;
5. rodar `npm run test:ci`;
6. atualizar esta matriz quando a cobertura envolver novo fluxo.

Exemplo:

```bash
npm run test:regression
npm run test:coverage
npm run test:ci
```

## Padrão para Features Futuras

Toda feature nova deve ter, conforme aplicável:

- teste unitário da regra;
- teste de integração para API/banco;
- teste de componente ou hook para UI;
- teste E2E para fluxo de usuário;
- teste de permissão quando envolver acesso;
- teste de segurança quando envolver sessão, autenticação, upload ou dado sensível;
- atualização da matriz deste documento.

Nenhuma feature deve ser considerada pronta apenas por teste manual.

## Como Interpretar Falhas

| Falha | Leitura provável | Ação |
| --- | --- | --- |
| `test:unit` | regra isolada mudou | revisar regra ou atualizar teste com nova regra documentada |
| `test:integration` | contrato entre módulos quebrou | revisar mocks, DTOs, services e guards |
| `test:regression` | bug antigo voltou | corrigir antes de merge |
| `test:migrations` | schema/migration inválido | corrigir migration versionada |
| `test:coverage` | cobertura abaixo do mínimo | criar testes de comportamento real |
| `test:e2e` | fluxo de usuário quebrou | verificar app, rotas, API mockada ou stack local |
| `test:smoke` | serviço indisponível | validar URLs, health checks e portas |

## Pendências Técnicas Controladas

Os itens abaixo ficaram estruturados, mas dependem de ambiente real de teste ou evolução funcional:

| Pendência | Justificativa | Recomendação |
| --- | --- | --- |
| E2E completo contra API e banco reais | Requer stack `docker-compose.test.yml` ativa e browsers Playwright instalados | Rodar em job dedicado com serviços ou em runner local |
| Seeds de múltiplos perfis reais no banco | O bootstrap atual cria admin e permissões essenciais | Evoluir `seed:test` se surgirem cenários E2E com usuário comum/inativo |
| Cobertura por todos os CRUDs CMS | A task priorizou regressões críticas e superfície de gestão já existente | Adicionar testes por módulo conforme features forem tocadas |
| Testes de acessibilidade completos | Não havia stack de Testing Library/axe | Adicionar validações incrementais em novas telas |
| Supertest de API HTTP real | Não havia `@nestjs/testing`/Supertest instalados | Avaliar depois, sem duplicar ferramentas sem necessidade |

## Validações Locais Executadas

Comandos executados com sucesso durante a implementação:

```bash
npm run test:api
npm run test:refresh
npm run test:portal
npm run test:unit
npm run test:integration
npm run test:regression
npm run test:security
npm run test:coverage
npm run test:migrations
npm run test:e2e
npm run test:smoke
npm run typecheck
npm run lint
npm run test:ci
npx playwright test --list
```

Observação: `test:e2e` e `test:smoke` foram validados no modo seguro de skip porque `RUN_E2E` e `RUN_SMOKE` não estavam habilitados. Eles devem ser habilitados somente com a stack local de teste pronta.

## Uso Antes de PR

Fluxo recomendado:

```bash
npm run test:ci
```

Para validação completa antes de PR grande, homologação ou mudanças em banco/sessão/upload:

```bash
npm run test:all
```

Para manter a stack de teste aberta depois:

```bash
npm run test:all -- --keep-stack
```

Para alterações pequenas que não envolvem Docker, banco real nem E2E, `test:ci` continua sendo o mínimo obrigatório.

## Uso Antes de Deploy

Em `development` e `homologation`:

```bash
npm run test:ci
```

Em `local-prod`:

```bash
npm run docker:local-prod:build
RUN_SMOKE=true npm run test:smoke
```

Em `production`:

- não rodar testes destrutivos;
- usar smoke tests não destrutivos;
- validar health checks;
- aplicar somente migrations versionadas;
- nunca gerar migration nova;
- nunca limpar banco;
- nunca aplicar seed de teste.
