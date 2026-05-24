# Tasks: Portabilidade de regras de negocio do CMS legado ICHC

**Input**: Design documents from `specs/001-portabilidade-regras-ichc/`.

**Prerequisites**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [quickstart.md](quickstart.md), [contracts/api-contracts.md](contracts/api-contracts.md), [checklists/requirements.md](checklists/requirements.md), `.specify/memory/constitution.md`.

**Current status**: Primeira fatia T007-T032 e T064-T065 executada e validada. T024 adicionou `Section.accessPolicy` com default `public`, atualizou contrato/DTO minimo e criou a migration versionada `20260524040920_add_section_access_policy`. T023 aplicou menu publico seguro no backend por `isActive`, `visibleInMenu`, `accessPolicy`, hierarquia e ordenacao por `order`; a suite T065 saiu do red esperado. T029 consolidou regressao combinada de conteudo publico, FriendlyUrl global e menu publico seguro. T025 registrou `contents.publish` no seed bootstrap idempotente; T026 bloqueou no backend publicacao, alteracao de validade de conteudo publicado e arquivamento de conteudo publicado sem `contents.publish`. T027 implementou fallback SEO seguro no payload publico; T028 implementou auditoria minima de mudancas criticas de conteudo e `Section.accessPolicy`. T030 atualizou contratos compartilhados da primeira fatia; T031 atualizou o Portal para preferir `url` canonica quando presente e tratar detalhe 404 como ausencia segura; T032 executou validacoes minimas. Demais tasks pendentes nao estao autorizadas nesta rodada.

**Execution guard**: Para tasks ainda pendentes, nenhuma implementacao, banco, migration, seed, runtime, Docker, Compose, script, workflow, commit, push, merge, deploy ou acao Git esta autorizada sem pedido explicito.

**Planning stabilization**: Este arquivo nao deve mais ser usado como fila unica para `$speckit-implement`. A primeira fatia foi encerrada; tasks abertas representam backlog/fases futuras. Para qualquer novo trabalho, criar uma subfatia pequena e autorizada ou uma spec nova, separando readiness/governanca, runtime, banco e backlog.

**Validation scripts confirmed in root `package.json`**: `npm run typecheck`, `npm run lint`, `npm run test:api`, `npm run test:portal`, `npm run test:refresh`, `npm run test:integration`, `npm run test:security`, `npm run test:migrations`, `npm run test:ci`, `npm run test:all`, `npm run check:deploy-flow`, `npm run docker:dev:migrate`, `npm run docker:local-prod:build`, `npm run docker:local-prod:up`, `npm run docker:local-prod:status`, `npm run test:smoke`, `npm run docker:prod:config`.

**Story mapping**:

- **US1**: Primeira fatia - protecao de publicacao e roteamento publico.
- **US2**: Permissoes, secoes e controle de acesso publico.
- **US3**: Tipos de conteudo/mascaras.
- **US4**: Busca publica, blocos e listagens.
- **US5**: SEO avancado, tags, anexos e galerias.
- **US6**: Workflow, newsletter e ouvidoria somente quando aprovados.

## Phase 0: Governanca, Rastreabilidade e Preparacao Documental

**Purpose**: Confirmar bloqueios, governanca e consistencia dos artefatos antes de qualquer implementacao.

- [x] T001 Validar branch atual/documentada e registrar decisao operacional em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: validation; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: registrar que `refactor/business-rules` permanece como excecao formal humana para esta feature/rodada.
  - Escopo: leitura documental e registro; Fora de escopo: checkout, rename, delete, reset, merge, commit ou push.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/spec.md`, `specs/001-portabilidade-regras-ichc/plan.md`, `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: DP-001, Constitution II.
  - Dependencias: nenhuma.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: nenhum automatizado; validacao documental.
  - Criterios de aceite: DP-001 consta como resolvida por excecao formal humana e nenhuma acao Git foi tomada.
  - Riscos: alto, por divergencia GitFlow.
  - Validacoes: textos em `plan.md`, `tasks.md` e `Resolved Decisions` conferidos durante a primeira fatia.
  - Documentacao: decisao final registrada antes da implementacao da primeira fatia.
  - Observacoes: concluida documentalmente; a excecao nao altera a regra geral de branch `feature/*`, `change/*` ou `fix/*` para futuras features.

- [x] T002 Registrar DP-001 resolvida por excecao formal humana em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: preservar rastreabilidade de que a decisao humana foi tomada antes de qualquer task runtime.
  - Escopo: registrar excecao formal; Fora de escopo: regularizar branch automaticamente.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: DP-001, FR-049.
  - Dependencias: T001.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: checklist documental.
  - Criterios de aceite: secao "Resolved Decisions" contem DP-001 e a secao de guardas futuros nao lista DP-001 como blocker ativo.
  - Riscos: critico se ignorado.
  - Validacoes: `tasks.md` revisado e DP-001 consta em `Resolved Decisions`.
  - Documentacao: trilha mantida em spec/plan/tasks.
  - Observacoes: concluida documentalmente; esta task preserva a trilha de governanca da excecao.

- [x] T003 Registrar excecao formal humana para `refactor/business-rules` em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: documentar que a implementacao desta feature/rodada continua em `refactor/business-rules` por excecao formal.
  - Escopo: registrar decisao quando fornecida; Fora de escopo: criar, trocar, renomear ou excluir branch.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`, futura documentacao de entrega.
  - Regras cobertas: Constitution II, DP-001.
  - Dependencias: T001, decisao humana registrada.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: nenhum.
  - Criterios de aceite: decisao explicita registrada antes de `$speckit-implement`.
  - Riscos: critico.
  - Validacoes: decisao humana registrada antes da primeira fatia runtime.
  - Documentacao: registrar novamente no PR ou doc tecnica futura, se houver.
  - Observacoes: concluida documentalmente; futuras features, changes ou fixes continuam exigindo branch `feature/*`, `change/*` ou `fix/*`.

- [x] T004 Validar que nenhum artefato legado sensivel sera copiado em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: security; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: reforcar proibicao de copiar PHP, SQL, HTML, CSS, JS, assets, cache, credenciais, SMTP, IPs, e-mails especificos, paths absolutos ou configuracoes antigas.
  - Escopo: checklist documental; Fora de escopo: ler/importar dados reais do legado.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/spec.md`, `specs/001-portabilidade-regras-ichc/tasks.md`, `.gitignore`.
  - Regras cobertas: FR-001, SC-003.
  - Dependencias: nenhuma.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: regressao documental contra ausencia de segredos legados.
  - Criterios de aceite: out-of-scope explicito permanece em tasks.
  - Riscos: critico.
  - Validacoes: proibicao preservada nos artefatos; diffs futuros ainda devem ser revisados para ausencia de legado sensivel.
  - Documentacao: proibicao mantida no plano, tasks e PR futuro.
  - Observacoes: concluida documentalmente; `.gitignore` ja ignora `Manager/` e `legado/`.

- [x] T005 Validar scripts reais do package.json para testes e gates em package.json
  - Tipo: validation; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: garantir que tasks citem apenas scripts existentes.
  - Escopo: conferir scripts de validacao; Fora de escopo: criar/alterar scripts.
  - Arquivos/modulos provaveis: `package.json`, `specs/001-portabilidade-regras-ichc/quickstart.md`, `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: Constitution VII, Quality Gates.
  - Dependencias: nenhuma.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: nenhum automatizado nesta etapa.
  - Criterios de aceite: tasks usam somente scripts confirmados ou registram "validar script equivalente no package.json antes da execucao".
  - Riscos: medio.
  - Validacoes: `package.json` confirmou os scripts listados no topo deste arquivo; gates da primeira fatia foram executados conforme registrado.
  - Documentacao: quickstart alinhado com validacoes executadas.
  - Observacoes: concluida documentalmente; comandos destrutivos Prisma seguem proibidos.

- [x] T006 Conferir consistencia dos artefatos Spec Kit em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 0; Prioridade: P0; Status: concluida.
  - Objetivo: garantir alinhamento entre spec, checklist, plan, research, data-model, quickstart, contracts e tasks.
  - Escopo: revisao documental; Fora de escopo: alterar runtime.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/*`, `.specify/memory/constitution.md`.
  - Regras cobertas: FR-002, FR-003, FR-049, SC-001, SC-002.
  - Dependencias: T001-T005.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: checklist documental.
  - Criterios de aceite: nenhum conflito entre GO COM RESSALVAS, DP-001 resolvida por excecao formal humana e primeira fatia.
  - Riscos: medio.
  - Validacoes: paths e artefatos revisados durante a primeira fatia, inclusive `checklists/requirements.md`.
  - Documentacao: tasks atualizadas para refletir implementacao e validacao da primeira fatia.
  - Observacoes: concluida documentalmente; manter sempre o caminho plural `checklists/requirements.md`.

## Phase 1: Protecao de Publicacao e Roteamento Publico

**Purpose**: Registrar a primeira fatia de protecao de publicacao e roteamento publico ja implementada e validada, preservando rastreabilidade de escopo, validacoes e guardas para qualquer fase futura.

- [x] T007 [US1] Adicionar testes de auth para status `Ativo` em apps/api/src/modules/auth/auth.service.test.ts
  - Tipo: test; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: cobrir login e recuperacao de senha para usuario nao `Ativo`.
  - Escopo: testes unitarios/seguranca; Fora de escopo: alterar service nesta task.
  - Arquivos/modulos provaveis: `apps/api/src/modules/auth/auth.service.test.ts`, `apps/api/src/modules/auth/auth.service.ts`.
  - Regras cobertas: FR-004, SC-006.
  - Dependencias: DP-001 resolvida por excecao formal humana, T003 resolvida para execucao.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: testes falham antes da correcao e passam apos AuthService bloquear todos status diferentes de `Ativo`.
  - Riscos: alto, autorizacao.
  - Validacoes: `npm run test:api`.
  - Documentacao: registrar regra no doc tecnico futuro.
  - Observacoes: manter CPF/e-mail/username como identificadores suportados.

- [x] T008 [US1] Implementar auth somente para usuario `Ativo` em apps/api/src/modules/auth/auth.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: bloquear login/recuperacao para qualquer status diferente de `Ativo`.
  - Escopo: `AuthService.login` e `canRecoverPassword`; Fora de escopo: modelagem de novos status.
  - Arquivos/modulos provaveis: `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/management/management-users.service.ts`.
  - Regras cobertas: FR-004, FR-005, SC-006.
  - Dependencias: DP-001 resolvida por excecao formal humana, T007, T003 resolvida.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: usuario `Verificado`, `Novo`, `Inativo` ou `Excluido` nao autentica.
  - Riscos: alto.
  - Validacoes: `npm run test:api`.
  - Documentacao: atualizar documentacao tecnica futura.
  - Observacoes: nao ampliar suporte legado de senha.

- [x] T009 [US1] Preservar status nativos `draft`, `published`, `archived` em packages/contracts/src/contents.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: garantir que contratos e DTOs nao recebam novos status legados.
  - Escopo: revisar contratos/DTOs e testes; Fora de escopo: criar enum legado.
  - Arquivos/modulos provaveis: `packages/contracts/src/contents.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/refresh/app/_lib/types.ts`.
  - Regras cobertas: DP-002, FR-021, FR-022.
  - Dependencias: DP-001 resolvida por excecao formal humana, T003 resolvida.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run typecheck`, `npm run test:api`, `npm run test:refresh`.
  - Criterios de aceite: nenhum status legado vira contrato publico.
  - Riscos: medio.
  - Validacoes: `npm run typecheck`.
  - Documentacao: manter tabela de mapeamento.
  - Observacoes: `Complemento` permanece fora da primeira fatia.

- [x] T010 [P] [US1] Documentar mapeamento de status legados para status nativos em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: registrar `Publicado -> published`, `Novo/Rascunho -> draft`, `Excluido -> archived`, `Complemento -> backlog`.
  - Escopo: documentacao; Fora de escopo: alterar banco.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/data-model.md`, `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: DP-002, FR-022.
  - Dependencias: T006.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: nao aplicavel.
  - Criterios de aceite: mapeamento rastreavel em tasks e docs futuros.
  - Riscos: medio.
  - Validacoes: revisao documental.
  - Documentacao: obrigatoria.
  - Observacoes: nao criar campo `legacyStatus` na primeira fatia.

- [x] T011 [US1] Criar testes da public policy compartilhada em apps/api/src/modules/contents/contents.service.test.ts
  - Tipo: test; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: cobrir `published`, `draft`, `archived`, `visibility`, secao ativa e validade.
  - Escopo: testes unitarios/integracao leve; Fora de escopo: implementar policy nesta task.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.test.ts`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-021, FR-022, FR-023, FR-035, SC-004.
  - Dependencias: DP-001 resolvida por excecao formal humana, T003 resolvida.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: cenarios de vazamento publico por status, visibilidade, secao inativa e detalhe inexistente falham antes da policy e passam depois.
  - Riscos: critico.
  - Validacoes: `npm run test:api`.
  - Documentacao: registrar regra centralizada.
  - Observacoes: policy e reusavel por lista/detalhe/busca/blocos; validade editorial foi complementada na subfatia 1C.

- [x] T012 [US1] Implementar public policy compartilhada de conteudo em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: centralizar regra publica para conteudo.
  - Escopo: service/helper no modulo de conteudos; Fora de escopo: busca publica completa.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-021, FR-022, FR-023, FR-035.
  - Dependencias: DP-001 resolvida por excecao formal humana, T011, T003 resolvida.
  - Migration: nao nesta subfatia; validade editorial foi adicionada em T015/T016. Seed: nao.
  - Testes obrigatorios: `npm run test:api`.
  - Criterios de aceite: uma unica policy protege listas e detalhe publico.
  - Riscos: critico.
  - Validacoes: `npm run test:api`, `npm run test:security`.
  - Documentacao: atualizar doc tecnica futura.
  - Observacoes: nao duplicar filtro em controllers; validade editorial permanece fora do escopo ate schema/migration propria.

- [x] T013 [US1] Aplicar public policy em listagem publica em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: garantir que `listPublished` use a policy compartilhada.
  - Escopo: endpoint `GET /api/v1/contents`; Fora de escopo: busca.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/portal/lib/api.ts`.
  - Regras cobertas: FR-021, FR-022, SC-004.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao nesta subfatia; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: lista publica nao retorna `draft`, `archived`, `private`, conteudo de secao inativa ou conteudo fora de validade quando `validateValidity = true`.
  - Riscos: critico.
  - Validacoes: `npm run test:api`.
  - Documentacao: atualizar contratos se payload mudar.
  - Observacoes: manter limite/paginacao atual ou planejar paginacao em Fase 4.

- [x] T014 [US1] Aplicar public policy em detalhe publico por slug/URL em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: impedir vazamento de conteudo nao publicado por `GET /contents/:slug`.
  - Escopo: `findBySlug` publico; Fora de escopo: preview autenticado.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/portal/app/[slug]/page.tsx`.
  - Regras cobertas: FR-021, FR-022, SC-004.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao nesta subfatia; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: detalhe publico retorna 404 para conteudo nao publico.
  - Riscos: critico.
  - Validacoes: `npm run test:api`.
  - Documentacao: atualizar contrato de erro 404.
  - Observacoes: preview autenticado fica backlog se nao aprovado.

- [x] T015 [US1] Modelar validade editorial ativa/inativa em apps/api/prisma/schema.prisma
  - Tipo: database; Fase: 1; Prioridade: P1; Status: condicional.
  - Objetivo: definir campos `validFrom`, `validUntil`, `validateValidity` no model `Content`.
  - Escopo: schema de validade editorial; Fora de escopo: `FriendlyUrl`, accessPolicy, menu, `contents.publish`, multi-secao e busca.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `specs/001-portabilidade-regras-ichc/data-model.md`.
  - Regras cobertas: FR-023, FR-024.
  - Dependencias: DP-001 resolvida por excecao formal humana, T006, decisao tecnica de modelo, migration oficial executada em dev.
  - Migration: sim, criada em `apps/api/prisma/migrations/20260524005604_add_content_editorial_validity/migration.sql`; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`, `npm run test:migrations`.
  - Criterios de aceite: modelo cobre validade ativa/inativa sem quebrar conteudos existentes; `validateValidity` usa default `false`.
  - Riscos: critico, dados reais.
  - Validacoes: `docker exec -w /app/apps/api abbatech-api npx prisma migrate status`; testes da subfatia 1C.
  - Documentacao: migration registrada em `data-model.md`.
  - Observacoes: nenhum seed/backfill foi criado.

- [x] T016 [US1] Criar migration versionada de validade editorial em apps/api/prisma/migrations/
  - Tipo: database; Fase: 1; Prioridade: P1; Status: condicional.
  - Objetivo: criar a migration `add_content_editorial_validity` pelo fluxo oficial de dev.
  - Escopo: migration versionada para `validFrom`, `validUntil` e `validateValidity`; Fora de escopo: SQL manual, `prisma db push`, `prisma migrate reset`, seeds e ambientes local-prod/production.
  - Arquivos/modulos provaveis: `apps/api/prisma/migrations/`, `apps/api/prisma/schema.prisma`.
  - Regras cobertas: FR-023, FR-024, SC-009.
  - Dependencias: DP-001 resolvida por excecao formal humana, T015.
  - Migration: sim, criada via `npm run docker:dev:migrate -- add_content_editorial_validity`; Seed: nao.
  - Testes obrigatorios: `npm run test:migrations`.
  - Criterios de aceite: migration versionada existe em `apps/api/prisma/migrations/20260524005604_add_content_editorial_validity/migration.sql` e banco dev esta up-to-date.
  - Riscos: critico.
  - Validacoes: `docker exec -w /app/apps/api abbatech-api npx prisma migrate status`, `npm run test:migrations`.
  - Documentacao: registrar migration criada em `data-model.md`.
  - Observacoes: permissao de shadow database foi aplicada somente no MySQL dev local antes desta execucao; nao replicar em local-prod/production.

- [x] T017 [US1] Garantir regra de fim do dia para `validUntil` em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: interpretar data final como valida ate o fim do dia quando horario nao for explicito.
  - Escopo: comparacao de validade na public policy compartilhada; Fora de escopo: timezone global novo, busca, preview e regras de permissao de publicacao.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-024.
  - Dependencias: DP-001 resolvida por excecao formal humana, T015, T016.
  - Migration: nao alem de T016; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`.
  - Criterios de aceite: conteudo valido no dia final aparece ate 23:59:59.999; lista publica e detalhe por slug usam a mesma policy.
  - Riscos: alto.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`.
  - Documentacao: regra registrada em `data-model.md`.
  - Observacoes: usa inicio do dia no timezone do servidor para comparar `validUntil` e manter o dia final inteiro.

- [x] T018 [US1] Modelar URL amigavel global `FriendlyUrl` em apps/api/prisma/schema.prisma
  - Tipo: database; Fase: 1; Prioridade: P1; Status: condicional.
  - Objetivo: definir entidade com `path` unico global e alvo secao/conteudo.
  - Escopo: schema nativo `FriendlyUrl`; Fora de escopo: resolver rota publica, redirect, `accessPolicy`, menu seguro e backfill destrutivo.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `packages/contracts/src/contents.ts`, `packages/contracts/src/sections.ts`.
  - Regras cobertas: FR-016, FR-017, DP-004.
  - Dependencias: DP-001 resolvida por excecao formal humana, `FriendlyUrl` dedicada aprovada.
  - Migration: sim, criada em `apps/api/prisma/migrations/20260524014757_add_friendly_urls/migration.sql`; Seed: nao.
  - Testes obrigatorios: `npm run test:migrations`, `npm run test:api`.
  - Criterios de aceite: modelo permite unicidade global entre secao e conteudo por `FriendlyUrl.path`.
  - Riscos: alto.
  - Validacoes: `docker exec -w /app/apps/api abbatech-api npx prisma migrate status`, `npm run test:migrations`, `npm run test:api`.
  - Documentacao: `data-model.md` e `contracts/api-contracts.md` atualizados.
  - Observacoes: `Section.slug`, `Section.path` e `Content.slug` permanecem como dados nativos auxiliares.

- [x] T019 [US1] Criar migration versionada para `FriendlyUrl` em apps/api/prisma/migrations/
  - Tipo: database; Fase: 1; Prioridade: P1; Status: condicional.
  - Objetivo: criar migration versionada para a tabela `FriendlyUrl`.
  - Escopo: criacao da tabela e indices/FKs opcionais; Fora de escopo: SQL manual, `prisma db push`, `prisma migrate reset`, backfill destrutivo e ambientes local-prod/production.
  - Arquivos/modulos provaveis: `apps/api/prisma/migrations/`, `apps/api/prisma/schema.prisma`.
  - Regras cobertas: FR-016, FR-017, SC-005, SC-009.
  - Dependencias: DP-001 resolvida por excecao formal humana, T018.
  - Migration: sim, criada somente em dev via `npm run docker:dev:migrate -- add_friendly_urls`; Seed: nao.
  - Testes obrigatorios: `npm run test:migrations`, `npm run test:api`.
  - Criterios de aceite: migration existe em `apps/api/prisma/migrations/20260524014757_add_friendly_urls/migration.sql` e banco dev esta up-to-date.
  - Riscos: alto.
  - Validacoes: `docker exec -w /app/apps/api abbatech-api npx prisma migrate status`, `npm run test:migrations`.
  - Documentacao: rollback e estrategia para colisoes registrados em `data-model.md`.
  - Observacoes: nao houve backfill de registros existentes nesta subfatia.

- [x] T020 [US1] Rejeitar URL duplicada antes de salvar em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: validar duplicidade global antes de criar/alterar conteudo ou secao.
  - Escopo: services de conteudo/secao e `FriendlyUrl`; Fora de escopo: rota publica nova, redirect e rotas tecnicas antigas.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/sections/sections.service.ts`, `apps/api/src/modules/friendly-urls/friendly-url.utils.ts`.
  - Regras cobertas: FR-016, FR-018, SC-005.
  - Dependencias: DP-001 resolvida por excecao formal humana, T064, T018.
  - Migration: sim, via T019; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: duplicidade global retorna erro antes de persistir; criacao/atualizacao registra `FriendlyUrl` de secao/conteudo; o mesmo alvo nao bloqueia sua propria URL.
  - Riscos: alto.
  - Validacoes: `npm run test:api`, `npm run typecheck -w @abbatech/api`.
  - Documentacao: contrato `409` mantido em `contracts/api-contracts.md`.
  - Observacoes: normalizacao de acentos/espacos/pontuacao foi centralizada em helper nativo.

- [x] T021 [US1] Garantir secao principal obrigatoria em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: preservar `Content.sectionId` obrigatorio e validar secao ativa/permitida.
  - Escopo: `ensureRelations`; Fora de escopo: multi-secao.
  - Arquivos/modulos alterados: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-019, SC-004.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao; Seed: nao; Schema: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`, `npm run typecheck -w @abbatech/api`, `npm run test:security`.
  - Criterios de aceite: `ensureRelations()` valida secao existente, secao ativa e secao permitida pelo escopo do perfil; create/update rejeitam secao principal inativa antes de persistir.
  - Riscos: alto.
  - Validacoes executadas: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` passou com 11 arquivos e 75 testes; `npm run typecheck -w @abbatech/api` passou; `npm run test:security` passou com 2 arquivos e 6 testes.
  - Documentacao: registrar secao principal como contrato.
  - Observacoes: banco ja exige `sectionId`; regra de negocio tem erro claro para secao invalida/inativa. Testes cobrem criacao com secao inativa e update com secao inativa, garantindo que `prisma.content.update`, `prisma.friendlyUrl.create` e `prisma.friendlyUrl.update` nao sejam chamados. Sem migration, seed, schema, Docker/Compose, local-prod ou production.

- [x] T022 [US1] Registrar associacao multi-secao como backlog/future spec em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 1; Prioridade: P1; Status: condicional, concluida documentalmente.
  - Objetivo: registrar que `ContentSection` nao entra na primeira fatia.
  - Escopo: documentar backlog/future spec de multi-secao; Fora de escopo: criar tabela ou migration de multi-secao.
  - Arquivos/modulos documentais relacionados: `specs/001-portabilidade-regras-ichc/spec.md`, `specs/001-portabilidade-regras-ichc/plan.md`, `specs/001-portabilidade-regras-ichc/data-model.md`, `specs/001-portabilidade-regras-ichc/checklists/requirements.md`, `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: FR-020.
  - Dependencias: decisao humana registrada.
  - Migration: nao na primeira fatia; Seed: nao.
  - Testes obrigatorios: futuro `npm run test:migrations`, `npm run test:api` se future spec aprovar multi-secao.
  - Criterios de aceite: primeira fatia usa apenas `Content.sectionId` ou equivalente nativo para secao principal obrigatoria.
  - Riscos: medio.
  - Validacoes: revisao documental confirmou multi-secao fora da primeira fatia em spec, plan, data-model, checklist e tasks.
  - Documentacao: registrada como backlog/future spec; nao criar `ContentSection`, tabela, relacao Prisma, backfill ou migration de multi-secao nesta primeira fatia.
  - Observacoes: regra legada de multiplas secoes permanece reconhecida e diferida. Nenhuma alteracao runtime foi feita para T022.

- [x] T023 [US1] Aplicar menu publico por hierarquia, ordem, visibilidade e policy em apps/api/src/modules/sections/sections.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: concluida.
  - Objetivo: impedir vazamento de secoes ocultas/restritas/inativas.
  - Escopo: endpoint publico `GET /sections`; Fora de escopo: redesign do Portal.
  - Arquivos/modulos alterados: `apps/api/src/modules/sections/sections.service.ts`.
  - Regras cobertas: FR-012, FR-013, FR-014, SC-006, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, T065, T024 concluida com `Section.accessPolicy`.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: menu publico lista apenas secoes permitidas, visiveis, ativas, hierarquicas e ordenadas.
  - Riscos: alto.
  - Validacoes: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` passou com 11 arquivos e 80 testes; T065 saiu do red esperado.
  - Documentacao: contrato de secoes atualizado em `contracts/api-contracts.md`.
  - Observacoes: preservar subpath `/abbatech/portal`. Autorizacao de acesso ao conteudo/rota fica fora desta task.

- [x] T024 [US1] Planejar policy de secao `public/restricted_visible/restricted_hidden` em apps/api/prisma/schema.prisma
  - Tipo: database; Fase: 1; Prioridade: P1; Status: concluida.
  - Objetivo: modelar controle publico de secao sem nomes legados.
  - Escopo: campo `accessPolicy`; Fora de escopo: implementar filtragem de menu, links externos/nova janela e Portal.
  - Arquivos/modulos alterados: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/sections/sections.controller.ts`, `apps/api/src/modules/sections/sections.service.ts`, `packages/contracts/src/sections.ts`.
  - Regras cobertas: DP-003, FR-014.
  - Dependencias: DP-001 resolvida por excecao formal humana, T065, T006.
  - Migration: sim, criada em dev via `npm run docker:dev:migrate -- add_section_access_policy` como `20260524040920_add_section_access_policy`; Seed: nao.
  - Testes obrigatorios: `npm run test:migrations`, `npm run typecheck -w @abbatech/api`, `npm run typecheck`, `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: secoes existentes recebem default seguro `public`; valores aceitos sao `public`, `restricted_visible` e `restricted_hidden`.
  - Riscos: alto.
  - Validacoes: `npm run test:migrations` passou; `npm run typecheck -w @abbatech/api` passou; `npm run typecheck` passou; `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` permaneceu red esperado com 4 falhas de T065 em `SectionsService public menu policy`, pendentes para T023.
  - Documentacao: mapear `Livre` -> `public`, `Restrita_Aparente` -> `restricted_visible`, `Restrita` -> `restricted_hidden`.
  - Observacoes: nao copiar nomenclatura legada como contrato tecnico. `restricted_visible` apenas existe como policy/contrato ate T023; `restricted_hidden` ainda nao sera filtrado pelo menu publico ate T023.

- [x] T025 [US1] Planejar seed idempotente minimo da permissao `contents.publish` em apps/api/prisma/seed/bootstrap.data.ts
  - Tipo: seed; Fase: 1; Prioridade: P1; Status: condicional.
  - Objetivo: registrar `contents.publish` como permissao granular oficial de publicacao.
  - Escopo: seed bootstrap idempotente minimo; Fora de escopo: seedar catalogo legado ou alterar seed demo/teste.
  - Arquivos/modulos provaveis: `apps/api/prisma/seed/bootstrap.data.ts`.
  - Regras cobertas: FR-027, FR-028, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, decisao `contents.publish` registrada.
  - Migration: nao; Seed: sim.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`; nao ha teste unitario especifico de seed bootstrap.
  - Criterios de aceite: seed bootstrap usa `contents.publish` por `upsert` existente e nao cria permissao legada ampla.
  - Riscos: alto.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` passou com 11 arquivos e 85 testes; seed demo/teste continua proibido em production.
  - Documentacao: permissao final registrada como `contents.publish`.
  - Observacoes: `contents.write` nao deve publicar, alterar para `published`, alterar validade de publicacao de conteudo publicado ou arquivar publicado sem `contents.publish`.

- [x] T026 [US1] Impedir que `contents.write` publique indevidamente em apps/api/src/modules/contents/contents.controller.ts
  - Tipo: security; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: exigir permissao granular para status `published`, validade e arquivamento de publicado.
  - Escopo: controller/service; Fora de escopo: UI completa de workflow e alteracao do guard.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.controller.ts`, `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-027, FR-028, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, T025.
  - Migration: nao; Seed: sim em T025.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`.
  - Criterios de aceite: usuario com `contents.write` sem `contents.publish` nao cria conteudo `published`, nao altera `draft` para `published`, nao altera validade de conteudo publicado e nao arquiva conteudo publicado; usuario com `contents.publish` publica quando os demais dados sao validos.
  - Riscos: critico.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` passou com 11 arquivos e 85 testes.
  - Documentacao: matriz de permissao atualizada nesta task.
  - Observacoes: frontend nao e fonte de autorizacao; service valida `AuthenticatedUser.permissions` e retorna `ForbiddenException` sem persistir alteracao.

- [x] T027 [US1] Garantir SEO fallback basico em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: manter SEO especifico quando existir e fallback por titulo/excerpt/secao.
  - Escopo: `upsertSeo` e payload publico; Fora de escopo: tags/imagem social avancada.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-038, SC-011.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`.
  - Criterios de aceite: SEO especifico sobrescreve fallback; fallback existe quando SEO ausente; fallback sanitiza HTML e valores sensiveis conhecidos.
  - Riscos: medio.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` passou com 11 arquivos e 93 testes.
  - Documentacao: contrato SEO atualizado em `contracts/api-contracts.md`.
  - Observacoes: SEO avancado, tags e imagem social ficam Fase 5.

- [x] T028 [US1] Auditar mudancas criticas de conteudo e secao em apps/api/src/modules/contents/contents.service.ts
  - Tipo: security; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: registrar publicar, arquivar, alterar URL, validade, secao principal e policy de secao.
  - Escopo: `AuditLog` com metadata minima; Fora de escopo: log de corpo completo ou segredo.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.service.test.ts`, `apps/api/src/modules/sections/sections.service.ts`, `apps/api/src/modules/sections/sections.service.test.ts`.
  - Regras cobertas: FR-048, SC-010.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012, T023, T024 se aplicavel.
  - Migration: nao se `AuditLog` atual bastar; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`; `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: auditoria registra usuario quando disponivel, acao, entidade, data via `AuditLog.createdAt` e metadata minima sem segredo/corpo completo.
  - Riscos: alto.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` passou com 11 arquivos e 93 testes; `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` passou com 11 arquivos e 93 testes.
  - Documentacao: documentar eventos de auditoria.
  - Observacoes: eventos implementados: `content.published`, `content.archived`, `content.url_changed`, `content.validity_changed`, `content.primary_section_changed`, `section.access_policy_changed`. Operacao bloqueada por falta de permissao nao persiste nem audita tentativa negada nesta subfatia.

- [x] T029 [US1] Consolidar testes de URL global e menu seguro em apps/api/src/modules/sections/sections.service.test.ts
  - Tipo: test; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: consolidar os testes antecipados de URL duplicada, conteudo publico, menu por hierarquia/ordem/visibilidade/policy e secao restrita.
  - Escopo: regressao API/service apos T064, T065 e T023; Fora de escopo: implementar nova regra.
  - Arquivos/modulos provaveis: `apps/api/src/modules/sections/sections.service.test.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-013, FR-014, FR-016, SC-005, SC-006, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, T064, T065, T020, T023, T024.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: regressao combinada passa cobrindo public policy de conteudo, validade, FriendlyUrl global, rejeicao de duplicidade e menu publico seguro.
  - Riscos: alto.
  - Validacoes: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts apps/api/src/modules/sections/sections.service.test.ts` passou com 11 arquivos e 80 testes.
  - Documentacao: cenario de aceite atualizado nesta task; contratos ja registram a regra de menu publico seguro da T023.
  - Observacoes: nenhum teste especifico de friendly-urls separado existe; a cobertura atual esta consolidada em `contents.service.test.ts` e `sections.service.test.ts`. Preservar subpaths em testes de portal separados.

- [x] T030 [US1] Atualizar contratos compartilhados da primeira fatia em packages/contracts/src/contents.ts
  - Tipo: backend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: expor campos aprovados de validade, URL e policy sem detalhes legados.
  - Escopo: `packages/contracts`; Fora de escopo: mudar UI sem backend.
  - Arquivos/modulos provaveis: `packages/contracts/src/contents.ts`, `packages/contracts/src/sections.ts`, `packages/contracts/src/index.ts`.
  - Regras cobertas: FR-017, FR-023, FR-038.
  - Dependencias: DP-001 resolvida por excecao formal humana, T015, T018, T024.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run typecheck`, `npm run test:portal`, `npm run test:refresh`.
  - Criterios de aceite: apps compilam com contratos atualizados.
  - Riscos: medio.
  - Validacoes: `npm run typecheck` passou.
  - Documentacao: `contracts/api-contracts.md` e `data-model.md` atualizados.
  - Observacoes: `PublicContent` passou a representar `seo` como presente no payload publico com fallback; `url` canonica e `section.url` sao opcionais quando disponibilizadas pela API; validade editorial foi exposta no contrato administrativo/escrita sem nomes legados.

- [x] T031 [US1] Atualizar portal para consumir policy segura sem layout legado em apps/portal/lib/api.ts
  - Tipo: frontend; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: garantir que Portal consuma endpoints seguros e trate 404/fallback sem reproduzir legado.
  - Escopo: cliente API e paginas existentes; Fora de escopo: redesenhar layout ou copiar HTML/CSS legado.
  - Arquivos/modulos provaveis: `apps/portal/lib/api.ts`, `apps/portal/app/page.tsx`, `apps/portal/app/[slug]/page.tsx`.
  - Regras cobertas: FR-021, FR-035, FR-038.
  - Dependencias: DP-001 resolvida por excecao formal humana, T013, T014, T030.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:portal`, `npm run typecheck`.
  - Criterios de aceite: portal nao renderiza conteudo nao publico.
  - Riscos: alto.
  - Validacoes: `npm run test:portal` passou.
  - Documentacao: impacto registrado em `contracts/api-contracts.md` e `quickstart.md`.
  - Observacoes: Portal prefere `content.url` quando presente, faz fallback para `/${slug}`, trata detalhe 404 como `notFound()` e preserva `/abbatech/portal`.

- [x] T032 [US1] Executar validacoes minimas da primeira fatia em package.json
  - Tipo: validation; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: validar primeira fatia com scripts reais.
  - Escopo: rodar gates locais quando implementacao for autorizada; Fora de escopo: rodar agora.
  - Arquivos/modulos provaveis: `package.json`, `specs/001-portabilidade-regras-ichc/quickstart.md`.
  - Regras cobertas: Constitution VII, Quality Gates.
  - Dependencias: DP-001 resolvida por excecao formal humana, T007-T031, T064, T065.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run typecheck`, `npm run lint`, `npm run test:api`, `npm run test:portal`, `npm run test:refresh`, `npm run test:migrations`.
  - Criterios de aceite: todos os scripts aplicaveis passam ou impedimento e documentado.
  - Riscos: alto.
  - Validacoes: `npm run typecheck`, `npm run test:portal`, `npm run test:refresh`, `npm run test:api`, `npm run test:migrations`, `npm run lint` e `npm run test:ci` passaram. `test:migrations` validou schema e pulou deploy em banco de teste por ausencia de `RUN_TEST_DATABASE=true`, conforme comportamento esperado do script. Dentro de `test:ci`, `test:e2e` foi pulado de forma controlada por ausencia de `RUN_E2E=true` e stack local de teste nao iniciada.
  - Documentacao: comandos executados registrados em `quickstart.md`.
  - Observacoes: o log SMTP offline em `test:api` permanece parte de teste controlado de auth e nao quebrou a suite.

- [x] T064 [US1] Criar testes de URL amigavel global antes da rejeicao de duplicidade em apps/api/src/modules/contents/contents.service.test.ts
  - Tipo: test; Fase: 1; Prioridade: P1; Status: obrigatoria.
  - Objetivo: definir cenarios que devem falhar antes de T020 e passar apos a regra de unicidade global.
  - Escopo: colisao entre URL de secao e conteudo, normalizacao de acentos/espacos/pontuacao e erro de escrita; Fora de escopo: rota publica nova, redirect ou portal.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.test.ts`, `apps/api/src/modules/sections/sections.service.test.ts`, `specs/001-portabilidade-regras-ichc/contracts/api-contracts.md`.
  - Regras cobertas: FR-016, FR-017, FR-018, SC-005.
  - Dependencias: DP-001 resolvida por excecao formal humana, `FriendlyUrl` dedicada aprovada.
  - Migration: sim, via T019; Seed: nao.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts apps/api/src/modules/sections/sections.service.test.ts`.
  - Criterios de aceite: testes cobrem criacao/atualizacao de secao e conteudo, colisao global, manutencao de `FriendlyUrl`, auto-colisao permitida e normalizacao.
  - Riscos: alto, colisao publica de rotas.
  - Validacoes: `npm run test:api`.
  - Documentacao: atualizar contrato `409` se necessario.
  - Observacoes: fonte de verdade planejada e `FriendlyUrl.path`.

- [x] T065 [US1] Criar testes de menu publico e `accessPolicy` antes da implementacao em apps/api/src/modules/sections/sections.service.test.ts
  - Tipo: test; Fase: 1; Prioridade: P1; Status: obrigatoria, concluida como teste antecipado/TDD em red esperado.
  - Objetivo: definir cenarios que devem falhar antes de T023/T024 e passar apos policy/menu seguro.
  - Escopo: hierarquia, ordem, visibilidade, `public`, `restricted_visible`, `restricted_hidden` e secao ativa; Fora de escopo: redesign do portal.
  - Arquivos/modulos alterados: `apps/api/src/modules/sections/sections.service.test.ts`.
  - Arquivos/modulos provaveis futuros: `apps/portal/lib/api.test.ts` se houver teste de consumo no Portal.
  - Regras cobertas: FR-012, FR-013, FR-014, SC-006, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, DP-003 mantida como policy nativa.
  - Migration: nao nesta task; Seed: nao nesta task.
  - Testes obrigatorios: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`.
  - Cenarios cobertos: raiz inativa ou `visibleInMenu = false` nao aparece; filho inativo ou oculto nao aparece; hierarquia recursiva e preservada; siblings sao ordenados por `order`; `accessPolicy = "public"` aparece; `accessPolicy = "restricted_visible"` aparece; `accessPolicy = "restricted_hidden"` nao aparece; payload preserva `path` sem depender do layout do Portal.
  - Criterios de aceite: testes de menu/accessPolicy existem antes de T023; apos T023, esses testes passam e validam menu seguro no backend.
  - Riscos: alto, vazamento de secao restrita.
  - Validacoes: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` executado apos T023; 11 arquivos de teste e 80 testes passaram.
  - Documentacao: registrar semantica de `restricted_visible` e `restricted_hidden`.
  - Observacoes: T023 implementou filtragem por `visibleInMenu`, filhos inativos/ocultos, montagem defensiva da arvore e `restricted_hidden`. Preservar subpath `/abbatech/portal`.

- [ ] T066 [US1] Planejar preview autenticado de conteudo nao publicado em future spec
  - Tipo: backlog; Fase: 1; Prioridade: P2; Status: backlog.
  - Objetivo: tratar FR-030 sem misturar preview autenticado com detalhe publico da primeira fatia.
  - Escopo: decisao explicita de produto/tecnica para preview com sessao, autorizacao e subpaths do Refresh; Fora de escopo: primeira fatia e endpoint publico anonimo.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.controller.ts`, `apps/api/src/modules/auth/permissions.guard.ts`, `apps/refresh/app`, `apps/portal/app`.
  - Regras cobertas: FR-030.
  - Dependencias: spec propria ou decisao explicita, DP-001 resolvida por excecao formal humana antes de qualquer implementacao futura.
  - Migration: condicional futura; Seed: nao.
  - Testes obrigatorios: futuros `npm run test:api`, `npm run test:security`, `npm run test:refresh`, `npm run test:portal`.
  - Criterios de aceite: preview nao vaza `draft`, `archived`, restrito ou fora de validade para usuario nao autorizado.
  - Riscos: critico, vazamento de conteudo nao publicado.
  - Validacoes: futuras validacoes de sessao/autorizacao/subpaths.
  - Documentacao: future spec de preview autenticado.
  - Observacoes: nao entra na primeira fatia.

## Phase 2: Permissoes, Secoes e Controle de Acesso Publico

- [ ] T033 [P] [US2] Refinar escopo por perfil/secao em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: diferenciar escopo editorial de escopo publico.
  - Escopo: `RoleSectionAccess` e policies; Fora de escopo: workflow completo.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/prisma/schema.prisma`.
  - Regras cobertas: FR-011, FR-014.
  - Dependencias: DP-001 resolvida por excecao formal humana, Fase 1 concluida.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: perfil sem secao nao publica/acessa escopo indevido.
  - Riscos: alto.
  - Validacoes: `npm run test:security`.
  - Documentacao: atualizar matriz de permissao.
  - Observacoes: nao depender da UI para autorizar.

- [ ] T034 [P] [US2] Diferenciar acesso, publicacao e visibilidade em apps/api/prisma/schema.prisma
  - Tipo: database; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: decidir se `RoleSectionAccess` precisa campos de acao.
  - Escopo: modelagem futura; Fora de escopo: criar migration sem decisao.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/management/management.dto.ts`.
  - Regras cobertas: FR-009, FR-011, FR-014.
  - Dependencias: DP-001 resolvida por excecao formal humana, T033.
  - Migration: condicional, somente dev; Seed: condicional.
  - Testes obrigatorios: `npm run test:migrations`, `npm run test:api`.
  - Criterios de aceite: modelo evita confundir ver menu com publicar.
  - Riscos: alto.
  - Validacoes: `npm run test:migrations`.
  - Documentacao: documentar decisao tecnica.
  - Observacoes: manter menor mudanca possivel.

- [ ] T035 [US2] Garantir bloqueio backend por permissao em apps/api/src/modules/auth/permissions.guard.ts
  - Tipo: security; Fase: 2; Prioridade: P2; Status: obrigatoria.
  - Objetivo: assegurar que controllers administrativos usam guards/permissoes explicitas.
  - Escopo: endpoints management, contents e sections; Fora de escopo: autorizacao por frontend.
  - Arquivos/modulos provaveis: `apps/api/src/modules/auth/permissions.guard.ts`, `apps/api/src/modules/management/management.controller.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/api/src/modules/sections/sections.controller.ts`.
  - Regras cobertas: FR-009, FR-010, SC-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, T025, T026.
  - Migration: nao; Seed: condicional.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: operacao sem permissao retorna 403 no backend.
  - Riscos: critico.
  - Validacoes: `npm run test:security`.
  - Documentacao: matriz de permissoes.
  - Observacoes: revisar cada endpoint tocado.

- [ ] T036 [US2] Validar secao restrita aparente vs restrita oculta em apps/api/src/modules/sections/sections.service.ts
  - Tipo: test; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: cobrir `restricted_visible` e `restricted_hidden` em menu/acesso.
  - Escopo: testes de service/API; Fora de escopo: UI complexa.
  - Arquivos/modulos provaveis: `apps/api/src/modules/sections/sections.service.test.ts`, `apps/portal/lib/api.test.ts`.
  - Regras cobertas: FR-013, FR-014.
  - Dependencias: DP-001 resolvida por excecao formal humana, T024, T023.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: `restricted_hidden` nao aparece para publico; `restricted_visible` aparece sem liberar acesso indevido.
  - Riscos: alto.
  - Validacoes: `npm run test:api`.
  - Documentacao: registrar semantica dos estados.
  - Observacoes: nomes nativos, nao legados.

- [ ] T037 [US2] Validar subpaths do Portal e Refresh em apps/portal/next.config.mjs
  - Tipo: validation; Fase: 2; Prioridade: P2; Status: obrigatoria.
  - Objetivo: garantir que mudancas de URL nao quebrem `/abbatech/portal` e `/abbatech/refresh`.
  - Escopo: build/test; Fora de escopo: alterar Next config.
  - Arquivos/modulos provaveis: `apps/portal/next.config.mjs`, `apps/refresh/next.config.mjs`, `apps/portal/lib/api.ts`, `apps/refresh/app/_lib/api.ts`.
  - Regras cobertas: Constitution IV.
  - Dependencias: DP-001 resolvida por excecao formal humana, Fase 1 ou 2 conforme tocado.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:portal`, `npm run test:refresh`, `npm run typecheck`.
  - Criterios de aceite: links e healthchecks continuam sob subpaths.
  - Riscos: alto.
  - Validacoes: `npm run typecheck`.
  - Documentacao: registrar impacto de rotas.
  - Observacoes: production usa `/abbatech/api`.

- [ ] T067 [US2] Validar unicidade de usuario e multiplos perfis em apps/api/src/modules/management/management-users.service.ts
  - Tipo: security; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: cobrir preservacao das regras de usuario unico e associacao a um ou mais perfis.
  - Escopo: CPF, e-mail, username, vinculos de perfis e perfil ativo conforme modelo nativo; Fora de escopo: importar usuarios legados ou criar identificadores novos.
  - Arquivos/modulos provaveis: `apps/api/src/modules/management/management-users.service.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/prisma/schema.prisma`.
  - Regras cobertas: FR-006, FR-007.
  - Dependencias: DP-001 resolvida por excecao formal humana, Fase 1 concluida ou decisao de antecipacao.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: usuario duplicado e rejeitado e usuario com multiplos perfis mantem permissoes coerentes.
  - Riscos: alto, autorizacao e identidade.
  - Validacoes: `npm run test:security`.
  - Documentacao: atualizar matriz de usuario/perfil.
  - Observacoes: respeitar regra mais forte ja existente no Refresh.

- [ ] T068 [US2] Validar caminho hierarquico e breadcrumb ao mover ou renomear secao em apps/api/src/modules/sections/sections.service.ts
  - Tipo: backend; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: garantir que descendentes, paths e breadcrumb continuem coerentes apos mudanca de secao.
  - Escopo: service de secoes, path/hierarquia e contrato publico; Fora de escopo: reproduzir navegacao visual do legado.
  - Arquivos/modulos provaveis: `apps/api/src/modules/sections/sections.service.ts`, `apps/api/src/modules/sections/sections.service.test.ts`, `apps/portal/lib/api.ts`.
  - Regras cobertas: FR-015.
  - Dependencias: DP-001 resolvida por excecao formal humana, T023, T024 se houver schema novo.
  - Migration: condicional; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: mover/renomear secao atualiza paths derivados e breadcrumb sem quebrar descendentes.
  - Riscos: alto, rotas publicas e SEO.
  - Validacoes: `npm run test:api`.
  - Documentacao: registrar regra de derivacao de breadcrumb.
  - Observacoes: se path for materializado, migration/backfill deve seguir fluxo dev oficial.

- [ ] T069 [US2] Planejar exclusao logica de conteudo publicado em apps/api/src/modules/contents/contents.service.ts
  - Tipo: security; Fase: 2; Prioridade: P2; Status: condicional.
  - Objetivo: assegurar que conteudo publicado ou com historico relevante seja arquivado/excluido logicamente.
  - Escopo: delete administrativo, status `archived`, auditoria e public policy; Fora de escopo: exclusao fisica insegura.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/api/src/modules/contents/contents.service.test.ts`.
  - Regras cobertas: FR-025.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012, T026, T028.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: conteudo publicado removido deixa de aparecer publicamente e preserva auditoria/historico.
  - Riscos: critico, perda de dado real ou vazamento publico.
  - Validacoes: `npm run test:security`.
  - Documentacao: registrar politica de exclusao logica.
  - Observacoes: exclusao fisica somente para auxiliares quando o Refresh ja fizer com seguranca.

- [ ] T070 [US2] Planejar filtros administrativos de conteudo em apps/refresh/app
  - Tipo: backlog; Fase: 2; Prioridade: P2; Status: backlog.
  - Objetivo: rastrear filtros por status, secao, tipo/mascara, usuario responsavel e texto.
  - Escopo: future spec de listagem administrativa e contrato backend; Fora de escopo: primeira fatia de portal publico.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.controller.ts`, `apps/api/src/modules/contents/contents.service.ts`, `apps/refresh/app`.
  - Regras cobertas: FR-029.
  - Dependencias: decisao de produto/admin, DP-001 resolvida por excecao formal humana antes de qualquer implementacao futura.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: futuros `npm run test:api`, `npm run test:refresh`.
  - Criterios de aceite: filtros administrativos ficam especificados antes de alterar tela ou endpoint.
  - Riscos: medio.
  - Validacoes: futuras.
  - Documentacao: future spec ou complemento de admin.
  - Observacoes: nao criar CMS paralelo nem reproduzir tela legada.

## Phase 3: Tipos de Conteudo e Mascaras

- [ ] T038 [P] [US3] Validar `ContentType.schemaJson` em apps/api/src/modules/management/management.service.ts
  - Tipo: backend; Fase: 3; Prioridade: P2; Status: condicional.
  - Objetivo: validar estrutura minima de mascara sem criar catalogo legado.
  - Escopo: schemaJson e DTOs; Fora de escopo: tipos legados amplos.
  - Arquivos/modulos provaveis: `apps/api/src/modules/management/management.service.ts`, `apps/api/src/modules/management/management.dto.ts`.
  - Regras cobertas: FR-031, FR-032, FR-033.
  - Dependencias: DP-001 resolvida por excecao formal humana, Fase 1 concluida.
  - Migration: nao provavel; Seed: condicional.
  - Testes obrigatorios: `npm run test:api`.
  - Criterios de aceite: schema invalido e rejeitado no backend.
  - Riscos: alto, CMS paralelo.
  - Validacoes: `npm run test:api`.
  - Documentacao: documentar formato aprovado.
  - Observacoes: usar modelos nativos do Refresh.

- [ ] T039 [US3] Aplicar campos obrigatorios no backend em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 3; Prioridade: P2; Status: condicional.
  - Objetivo: bloquear salvamento quando campo requerido pela mascara estiver vazio.
  - Escopo: validacao de conteudo por `ContentType.schemaJson`; Fora de escopo: validacao apenas frontend.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/management/management.types.ts`.
  - Regras cobertas: FR-019, FR-031, FR-032.
  - Dependencias: DP-001 resolvida por excecao formal humana, T038.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: `npm run test:api`.
  - Criterios de aceite: payload incompleto falha com erro claro.
  - Riscos: alto.
  - Validacoes: `npm run test:api`.
  - Documentacao: matriz de campos minimos.
  - Observacoes: nao portar scripts legados de validacao.

- [ ] T040 [US3] Garantir tipo minimo/generico em apps/api/prisma/seed/bootstrap.data.ts
  - Tipo: seed; Fase: 3; Prioridade: P2; Status: condicional.
  - Objetivo: seedar tipo generico apenas se bootstrap nao tiver `ContentType` utilizavel.
  - Escopo: seed idempotente minimo; Fora de escopo: seed catalogo legado.
  - Arquivos/modulos provaveis: `apps/api/prisma/seed/bootstrap.data.ts`, `apps/api/prisma/seed-test.ts`.
  - Regras cobertas: DP-008, FR-033.
  - Dependencias: DP-001 resolvida por excecao formal humana, T038.
  - Migration: nao; Seed: sim se necessario.
  - Testes obrigatorios: `npm run test:api`.
  - Criterios de aceite: Refresh consegue criar conteudo generico sem seed legado amplo.
  - Riscos: medio.
  - Validacoes: `npm run test:api`.
  - Documentacao: documentar seed minimo.
  - Observacoes: production nao deve rodar seed demo/teste.

- [ ] T041 [P] [US3] Separar tipos condicionais Noticias, Documentos/Publicacoes e Banner em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 3; Prioridade: P2; Status: backlog.
  - Objetivo: manter tipos condicionais fora da primeira fatia ate aprovacao.
  - Escopo: documentacao; Fora de escopo: seed ou telas.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`, `specs/001-portabilidade-regras-ichc/data-model.md`.
  - Regras cobertas: DP-008, FR-033.
  - Dependencias: T006.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: nao aplicavel.
  - Criterios de aceite: tipos condicionais claramente listados como fase futura.
  - Riscos: medio.
  - Validacoes: revisao documental.
  - Documentacao: obrigatoria.
  - Observacoes: evita CMS paralelo.

- [ ] T042 [P] [US3] Colocar demais tipos legados em backlog em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: backlog; Fase: 3; Prioridade: P3; Status: backlog.
  - Objetivo: impedir reproducao por inercia de Licitacoes, Galeria, Audios, FAQ, Pop-up, Depoimentos, Locais e similares.
  - Escopo: backlog/future spec; Fora de escopo: implementar agora.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`.
  - Regras cobertas: DP-008, FR-033.
  - Dependencias: T041.
  - Migration: condicional futura; Seed: condicional futura.
  - Testes obrigatorios: futuros por spec propria.
  - Criterios de aceite: catalogo legado amplo fora da primeira fatia.
  - Riscos: alto, CMS paralelo.
  - Validacoes: revisao documental.
  - Documentacao: future spec.
  - Observacoes: cada tipo futuro deve justificar valor de produto.

## Phase 4: Busca Publica e Blocos/Listagens

- [ ] T043 [US4] Planejar busca publica somente em conteudos publicados e acessiveis em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 4; Prioridade: P2; Status: backlog.
  - Objetivo: reusar public policy para busca.
  - Escopo: future spec de busca; Fora de escopo: implementar na primeira fatia sem aprovacao.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/contents/contents.controller.ts`, `apps/portal/lib/api.ts`.
  - Regras cobertas: FR-035, FR-037.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: busca nunca retorna conteudo nao publicado/restrito.
  - Riscos: alto.
  - Validacoes: scripts futuros.
  - Documentacao: contrato de busca futuro.
  - Observacoes: nao incluir na primeira fatia sem aprovacao.

- [ ] T044 [P] [US4] Planejar paginacao segura para listas publicas em contracts/api-contracts.md
  - Tipo: docs; Fase: 4; Prioridade: P2; Status: backlog.
  - Objetivo: definir `page`/`pageSize` e limites antes de implementar.
  - Escopo: contrato; Fora de escopo: runtime.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/contracts/api-contracts.md`.
  - Regras cobertas: FR-036, FR-037.
  - Dependencias: T043.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: futuros contract/API.
  - Criterios de aceite: limites e defaults documentados.
  - Riscos: medio.
  - Validacoes: revisao de contrato.
  - Documentacao: obrigatoria.
  - Observacoes: evitar pagina sem limite.

- [ ] T045 [P] [US4] Planejar ordenacoes permitidas para listas publicas em contracts/api-contracts.md
  - Tipo: docs; Fase: 4; Prioridade: P2; Status: backlog.
  - Objetivo: permitir apenas ordenacoes seguras e intencionais.
  - Escopo: data, cadastro, titulo, ordem aprovada; Fora de escopo: ordenacao aleatoria sem decisao.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/contracts/api-contracts.md`.
  - Regras cobertas: FR-036.
  - Dependencias: T043.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: futuros API.
  - Criterios de aceite: ordenacoes inseguras rejeitadas.
  - Riscos: medio.
  - Validacoes: revisao de contrato.
  - Documentacao: obrigatoria.
  - Observacoes: ordenacao aleatoria fica condicional.

- [ ] T046 [US4] Reusar public policy em blocos/listagens em apps/api/src/modules/contents/contents.service.ts
  - Tipo: backend; Fase: 4; Prioridade: P2; Status: backlog.
  - Objetivo: impedir duplicacao de filtros em blocos.
  - Escopo: future spec de blocos; Fora de escopo: templates legados.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/templates/templates.service.ts`, `apps/portal/app/page.tsx`.
  - Regras cobertas: FR-034, FR-035.
  - Dependencias: DP-001 resolvida por excecao formal humana, T012.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:portal`.
  - Criterios de aceite: blocos respeitam public policy.
  - Riscos: alto.
  - Validacoes: futuras.
  - Documentacao: registrar comportamento.
  - Observacoes: nao copiar `Manager/Template.php`.

## Phase 5: SEO Avancado, Tags, Anexos e Galerias

- [ ] T047 [P] [US5] Planejar tags/metatags editoriais em apps/api/prisma/schema.prisma
  - Tipo: backlog; Fase: 5; Prioridade: P3; Status: backlog.
  - Objetivo: future spec para `Tag`/`ContentTag`.
  - Escopo: modelagem futura; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-039.
  - Dependencias: aprovacao de produto.
  - Migration: sim futura em dev; Seed: condicional futura.
  - Testes obrigatorios: futuros `npm run test:migrations`, `npm run test:api`.
  - Criterios de aceite: tags nao duplicam modelo nem vazam conteudo nao publico.
  - Riscos: medio.
  - Validacoes: futuras.
  - Documentacao: future spec.
  - Observacoes: conteudos relacionados podem usar tags se aprovado.

- [ ] T048 [P] [US5] Planejar conteudos relacionados em apps/api/prisma/schema.prisma
  - Tipo: backlog; Fase: 5; Prioridade: P3; Status: backlog.
  - Objetivo: decidir tags, relacao explicita ou ambos.
  - Escopo: future spec; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: DP-005, FR-034, FR-039.
  - Dependencias: decisao de produto.
  - Migration: condicional futura; Seed: nao.
  - Testes obrigatorios: futuros API/portal.
  - Criterios de aceite: relacionados respeitam public policy.
  - Riscos: medio.
  - Validacoes: futuras.
  - Documentacao: future spec.
  - Observacoes: nao bloquear MVP.

- [ ] T049 [P] [US5] Planejar anexos usando `MediaAsset` e UploadService em apps/api/src/modules/upload/upload.service.ts
  - Tipo: backlog; Fase: 5; Prioridade: P3; Status: backlog.
  - Objetivo: future spec para anexos de conteudo.
  - Escopo: reuso de upload/storage; Fora de escopo: copiar paths legados.
  - Arquivos/modulos provaveis: `apps/api/src/modules/upload/upload.service.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-040, FR-042.
  - Dependencias: aprovacao de produto e LGPD.
  - Migration: sim futura; Seed: nao.
  - Testes obrigatorios: futuros `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: MIME/extensao/tamanho/LGPD validados.
  - Riscos: alto.
  - Validacoes: futuras.
  - Documentacao: politica de upload.
  - Observacoes: nao migrar arquivos legados sem plano de dados.

- [ ] T050 [P] [US5] Planejar galerias usando `MediaAsset` em apps/api/prisma/schema.prisma
  - Tipo: backlog; Fase: 5; Prioridade: P3; Status: backlog.
  - Objetivo: future spec para imagens vinculadas a conteudo.
  - Escopo: metadados, ordem, thumb e imagem principal; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/upload/upload.service.ts`, `apps/portal/app/[slug]/page.tsx`.
  - Regras cobertas: FR-041, FR-042.
  - Dependencias: aprovacao de produto.
  - Migration: sim futura; Seed: nao.
  - Testes obrigatorios: futuros API/upload/portal.
  - Criterios de aceite: galeria respeita public policy e LGPD.
  - Riscos: medio.
  - Validacoes: futuras.
  - Documentacao: future spec.
  - Observacoes: nao copiar assets do legado.

## Phase 6: Workflow Editorial Completo

- [ ] T051 [US6] Planejar encaminhamento editorial em apps/api/prisma/schema.prisma
  - Tipo: backlog; Fase: 6; Prioridade: P3; Status: backlog.
  - Objetivo: modelar eventos de workflow com remetente, destinatario, status e comentario.
  - Escopo: future spec; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-043, FR-044.
  - Dependencias: decisao de produto.
  - Migration: sim futura; Seed: condicional futura.
  - Testes obrigatorios: futuros `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: workflow preserva historico e nao permite destinatario invalido.
  - Riscos: alto.
  - Validacoes: futuras.
  - Documentacao: future spec.
  - Observacoes: usar `Role.parentRoleId`, nao regras PHP legadas.

- [ ] T052 [P] [US6] Planejar destinatario elegivel por hierarquia de perfil em apps/api/src/modules/management/management.service.ts
  - Tipo: backlog; Fase: 6; Prioridade: P3; Status: backlog.
  - Objetivo: usar `Role.parentRoleId` para elegibilidade.
  - Escopo: future workflow; Fora de escopo: publicar na primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/src/modules/management/management.service.ts`, `apps/api/src/modules/contents/contents.service.ts`.
  - Regras cobertas: FR-008, FR-043.
  - Dependencias: T051.
  - Migration: nao provavel; Seed: condicional.
  - Testes obrigatorios: futuros API/security.
  - Criterios de aceite: autores/editores/publicadores seguem hierarquia aprovada.
  - Riscos: alto.
  - Validacoes: futuras.
  - Documentacao: matriz de workflow.
  - Observacoes: administradores podem ter visao ampla se aprovado.

- [ ] T053 [P] [US6] Planejar notificacao editorial sem segredos em apps/api/src/modules/auth/password-reset-mail.service.ts
  - Tipo: backlog; Fase: 6; Prioridade: P3; Status: backlog.
  - Objetivo: definir notificacao interna/e-mail para workflow.
  - Escopo: future spec de notificacao; Fora de escopo: SMTP legado.
  - Arquivos/modulos provaveis: `apps/api/src/modules/auth/password-reset-mail.service.ts`, futuro modulo de notificacao.
  - Regras cobertas: FR-043.
  - Dependencias: T051.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: futuros email/security.
  - Criterios de aceite: falha de notificacao nao vaza segredo e e auditavel.
  - Riscos: alto.
  - Validacoes: futuras.
  - Documentacao: politica SMTP por ambiente.
  - Observacoes: nao migrar SMTP legado.

## Phase 7: Newsletter

- [ ] T054 [US6] Planejar envio real de newsletter em apps/api/src/modules/management/management-newsletters.service.ts
  - Tipo: backlog; Fase: 7; Prioridade: P3; Status: backlog.
  - Objetivo: future spec para envio, destinatarios e dispatch/log.
  - Escopo: usar `NewsletterCampaign`, `NewsletterRecipient`, `NewsletterDispatch`; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/src/modules/management/management-newsletters.service.ts`, `apps/api/src/modules/newsletters/newsletters.service.ts`.
  - Regras cobertas: FR-045, FR-046.
  - Dependencias: decisao explicita de produto.
  - Migration: condicional futura; Seed: condicional futura.
  - Testes obrigatorios: futuros `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: envio registra quantidade e log, sem credenciais legadas.
  - Riscos: alto, LGPD/e-mail.
  - Validacoes: futuras por ambiente.
  - Documentacao: future spec.
  - Observacoes: nao bloqueia primeira fatia.

- [ ] T055 [P] [US6] Validar SMTP por ambiente sem migrar legado em .env.example
  - Tipo: validation; Fase: 7; Prioridade: P3; Status: backlog.
  - Objetivo: planejar validacao SMTP apenas com configs do Refresh.
  - Escopo: exemplos e docs futuras; Fora de escopo: copiar SMTP/senhas/e-mails do legado.
  - Arquivos/modulos provaveis: `.env.example`, `.env.local-prod.example`, `.env.production.dokploy.example`.
  - Regras cobertas: FR-046.
  - Dependencias: DP-001 resolvida por excecao formal humana, T054.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: futuros email/security.
  - Criterios de aceite: nenhuma config legada aparece em envs versionados.
  - Riscos: critico.
  - Validacoes: revisao de diff futuro.
  - Documentacao: politica por ambiente.
  - Observacoes: nao alterar envs nesta etapa.

## Phase 8: Ouvidoria/Contato

- [ ] T056 [US6] Registrar decisao formal de produto sobre ouvidoria em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: backlog; Fase: 8; Prioridade: P3; Status: backlog.
  - Objetivo: impedir implementacao de ouvidoria sem aprovacao.
  - Escopo: future spec; Fora de escopo: mapear automaticamente para `PrivacyRequest`.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`, `apps/api/src/modules/privacy/privacy.service.ts`.
  - Regras cobertas: DP-007, FR-047.
  - Dependencias: decisao de produto.
  - Migration: condicional futura; Seed: condicional futura.
  - Testes obrigatorios: futuros LGPD/security.
  - Criterios de aceite: ouvidoria nao entra sem decisao formal.
  - Riscos: alto, dados pessoais.
  - Validacoes: revisao documental.
  - Documentacao: future spec.
  - Observacoes: `PrivacyRequest` cobre LGPD, nao ouvidoria.

- [ ] T057 [P] [US6] Planejar LGPD, status e notificacao de ouvidoria em apps/api/prisma/schema.prisma
  - Tipo: backlog; Fase: 8; Prioridade: P3; Status: backlog.
  - Objetivo: modelar manifestacao, status, responsavel, resposta, notificacao e filtros.
  - Escopo: future spec; Fora de escopo: primeira fatia.
  - Arquivos/modulos provaveis: `apps/api/prisma/schema.prisma`, `apps/api/src/modules/privacy/privacy.service.ts`.
  - Regras cobertas: FR-047.
  - Dependencias: T056.
  - Migration: sim futura; Seed: condicional.
  - Testes obrigatorios: futuros `npm run test:migrations`, `npm run test:security`.
  - Criterios de aceite: dados pessoais tem retencao, auditoria e acesso controlado.
  - Riscos: critico.
  - Validacoes: futuras.
  - Documentacao: future spec LGPD.
  - Observacoes: nao copiar e-mails legados de ouvidoria.

## Phase 9: Auditoria, Historico e Hardening

- [ ] T058 Consolidar auditoria e historico da primeira fatia em apps/api/src/modules/contents/contents.service.ts
  - Tipo: security; Fase: 9; Prioridade: P1; Status: obrigatoria.
  - Objetivo: revisar `ContentRevision` e `AuditLog` apos implementacao da fatia.
  - Escopo: conteudo, secao, URL, validade e publicacao; Fora de escopo: workflow completo.
  - Arquivos/modulos provaveis: `apps/api/src/modules/contents/contents.service.ts`, `apps/api/src/modules/sections/sections.service.ts`.
  - Regras cobertas: FR-026, FR-048, SC-010.
  - Dependencias: DP-001 resolvida por excecao formal humana, T028.
  - Migration: nao provavel; Seed: nao.
  - Testes obrigatorios: `npm run test:api`, `npm run test:security`.
  - Criterios de aceite: auditoria e revisao preservam rastreabilidade sem segredo.
  - Riscos: alto.
  - Validacoes: `npm run test:security`.
  - Documentacao: eventos auditados.
  - Observacoes: metadata minima.

- [ ] T059 [P] Garantir logs sem segredo em apps/api/src/modules
  - Tipo: security; Fase: 9; Prioridade: P1; Status: obrigatoria.
  - Objetivo: revisar logs adicionados pela feature.
  - Escopo: API e scripts de validacao futuros; Fora de escopo: logar credenciais ou payload sensivel.
  - Arquivos/modulos provaveis: `apps/api/src/modules/**`, `scripts/**`.
  - Regras cobertas: Constitution VI, FR-001.
  - Dependencias: DP-001 resolvida por excecao formal humana, implementacao da primeira fatia.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: `npm run test:security`.
  - Criterios de aceite: nenhum segredo, token, senha, SMTP ou dado legado em log.
  - Riscos: critico.
  - Validacoes: `npm run test:security`.
  - Documentacao: checklist de seguranca.
  - Observacoes: nao alterar scripts nesta etapa documental.

- [ ] T060 Validar gates automatizados da primeira fatia em package.json
  - Tipo: validation; Fase: 9; Prioridade: P1; Status: obrigatoria.
  - Objetivo: rodar gates reais antes de PR quando implementacao for autorizada.
  - Escopo: validacoes oficiais; Fora de escopo: inventar scripts.
  - Arquivos/modulos provaveis: `package.json`.
  - Regras cobertas: Constitution VII, Quality Gates.
  - Dependencias: DP-001 resolvida por excecao formal humana, T032, T058, T059.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run typecheck`, `npm run lint`, `npm run test:api`, `npm run test:portal`, `npm run test:refresh`, `npm run test:migrations`, `npm run test:ci`.
  - Criterios de aceite: gates passam ou impedimento e documentado.
  - Riscos: alto.
  - Validacoes: scripts reais listados.
  - Documentacao: registrar comandos executados.
  - Observacoes: `npm run test:all` deve ser avaliado para banco/auth/permissao/portal.

- [ ] T061 Validar local-prod e production checklist sem alterar ambientes em package.json
  - Tipo: validation; Fase: 9; Prioridade: P1; Status: condicional.
  - Objetivo: planejar validacao de ambiente para mudancas de banco/auth/portal.
  - Escopo: comandos reais; Fora de escopo: deploy.
  - Arquivos/modulos provaveis: `package.json`, `docker-compose.local-prod.yml`, `docker-compose.prod.yml`.
  - Regras cobertas: Constitution III, IV, V, FR-050.
  - Dependencias: DP-001 resolvida por excecao formal humana, implementacao aprovada e PR futuro.
  - Migration: condicional; Seed: nao em production.
  - Testes obrigatorios: `npm run docker:local-prod:build`, `npm run docker:local-prod:up`, `npm run docker:local-prod:status`, `npm run test:smoke`, `npm run docker:prod:config`.
  - Criterios de aceite: local-prod validado e production apenas checklist futuro sem alteracao real.
  - Riscos: alto.
  - Validacoes: scripts reais listados.
  - Documentacao: registrar ambiente, comandos e resultado.
  - Observacoes: nao executar deploy sem instrucao explicita.

- [ ] T062 Atualizar documentacao tecnica auditavel em specs/001-portabilidade-regras-ichc/tasks.md
  - Tipo: docs; Fase: 9; Prioridade: P1; Status: obrigatoria.
  - Objetivo: garantir trilha de decisao, testes, riscos, rollback e fluxo GitFlow.
  - Escopo: Spec Kit/PR/docs versionadas conforme `.gitignore`; Fora de escopo: versionar `docs/*` sem excecao.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/tasks.md`, futura doc em `docs/` se liberada.
  - Regras cobertas: FR-049, SC-010.
  - Dependencias: tasks executadas futuramente.
  - Migration: nao; Seed: nao.
  - Testes obrigatorios: revisao documental.
  - Criterios de aceite: outro desenvolvedor consegue auditar sem a conversa original.
  - Riscos: medio.
  - Validacoes: revisar `.gitignore` antes de versionar docs.
  - Documentacao: obrigatoria.
  - Observacoes: docs locais ignoradas nao substituem PR/spec/tasks.

- [ ] T063 Validar rollback por fase em specs/001-portabilidade-regras-ichc/plan.md
  - Tipo: validation; Fase: 9; Prioridade: P1; Status: obrigatoria.
  - Objetivo: confirmar rollback para schema, seed, policy e portal antes de PR/deploy.
  - Escopo: plano de rollback versionado; Fora de escopo: SQL manual.
  - Arquivos/modulos provaveis: `specs/001-portabilidade-regras-ichc/plan.md`, `apps/api/prisma/migrations/`.
  - Regras cobertas: Constitution V, FR-049.
  - Dependencias: DP-001 resolvida por excecao formal humana, migrations/seeds futuras.
  - Migration: condicional; Seed: condicional.
  - Testes obrigatorios: `npm run test:migrations`, `npm run test:ci`.
  - Criterios de aceite: rollback documentado por migration versionada ou reversao de codigo.
  - Riscos: critico.
  - Validacoes: `npm run test:migrations`.
  - Documentacao: rollback obrigatorio.
  - Observacoes: rollback em production exige aprovacao humana e backup.

## Execution Order

1. T001 -> T002 -> T003: registrar excecao formal humana de DP-001 antes de qualquer implementacao.
2. T004 -> T005 -> T006: confirmar seguranca documental, scripts reais e consistencia Spec Kit.
3. T007 -> T008: testes e correcao de auth `Ativo`.
4. T009 -> T010: status nativos e mapeamento legado.
5. T011 -> T012 -> T013 -> T014: policy publica compartilhada, lista e detalhe.
6. T015 -> T016 -> T017: validade editorial e regra de fim do dia.
7. T018 -> T064 -> T019 -> T020: URL amigavel global, testes antecipados e rejeicao de duplicidade.
8. T021 -> T022: secao principal concluida e multi-secao registrada como backlog/future spec documental.
9. T065 -> T024 -> T023 -> T029: T065 concluida como testes antecipados/TDD; T024 concluida com `Section.accessPolicy` e migration `20260524040920_add_section_access_policy`; T023 concluida com menu publico seguro no backend; T029 concluida com regressao combinada de conteudo publico, FriendlyUrl global e menu seguro.
10. T025 -> T026: concluida permissao granular de publicacao e bloqueio de `contents.write` para operacoes de publicacao.
11. T027 -> T028: concluida SEO fallback e auditoria minima de mudancas criticas.
12. T030 -> T031 -> T032: concluida sequencia de contratos compartilhados, consumo seguro no Portal e validacoes minimas da primeira fatia.
13. T033-T037 e T067-T070: proxima sequencia futura da Fase 2, apos nova autorizacao humana.
14. T038-T042: Fase 3, tipos/mascaras.
15. T043-T046: Fase 4, busca/blocos/listagens.
16. T047-T050: Fase 5, backlog de SEO avancado/tags/anexos/galerias.
17. T051-T053: Fase 6, workflow completo.
18. T054-T055: Fase 7, newsletter.
19. T056-T057: Fase 8, ouvidoria.
20. T058-T063: hardening, gates, documentacao e rollback.

## First Implementation Slice

**Slice**: Fase 1 - Protecao de publicacao e roteamento publico.

**Status**: Primeira fatia T007-T032 e T064-T065 concluida e validada nesta rodada. Proximas fases exigem nova autorizacao humana explicita antes de qualquer implementacao.

**Inclui**: T007-T032 e T064-T065, com dependencia obrigatoria de T001-T006 e DP-001 resolvida por excecao formal humana.

**Nao inclui**: T066 preview autenticado, que permanece backlog/condicional e exige spec propria ou decisao explicita.

**Objetivo independente**: impedir exposicao publica de conteudo nao publicado, restrito, excluido ou fora de validade; impedir publicacao por perfil sem permissao; garantir URL global, secao principal, menu seguro, SEO fallback e auditoria minima.

**Validacao minima executada em T032 e gates posteriores**: `npm run typecheck`, `npm run test:api`, `npm run test:portal`, `npm run test:refresh`, `npm run test:migrations`, `npm run lint` e `npm run test:ci` passaram. O `npm run test:ci` executou deployment flow guard, lint, typecheck, coverage, integration, regression, migrations e build; `test:e2e` foi pulado de forma controlada porque `RUN_E2E=true` nao estava setado e a stack local de teste nao estava iniciada.

## Future Work Guards

- A primeira fatia T007-T032 e T064-T065 ja foi implementada e validada; esta secao nao representa blocker pendente para essa fatia.
- Qualquer nova fase/task pendente exige autorizacao humana explicita antes de implementacao.
- Nao executar este `tasks.md` completo como backlog automatico; usar subfatia pequena ou nova spec.
- Antes de autorizar uma fase futura, separar tasks de readiness/documentacao das tasks runtime e nao misturar backlog com checklist executavel.
- Testes TDD em red devem ser marcados como "teste criado" ate a implementacao correspondente entregar o comportamento.
- Antes de trabalho futuro, revisar status/diff do workspace, sem acao Git automatica.
- Confirmar working tree sem alteracoes alheias que afetem a proxima fase autorizada.
- Confirmar ausencia de arquivos sensiveis, segredos, dumps, backups, `.env` real ou artefatos legados.
- Sem autorizacao explicita, permanecem proibidos: acao Git de escrita, banco, migration, seed, Docker, Compose, script, workflow, commit, push, merge e deploy.

## Resolved Decisions

- DP-001: resolvida por excecao formal humana. A branch `refactor/business-rules` sera mantida para esta feature/rodada porque a feature ja foi iniciada e documentada nessa branch. A excecao nao altera a regra geral da Refresh Constitution 1.1.0; futuras features, changes ou fixes devem usar branch especifica com prefixo `feature/*`, `change/*` ou `fix/*`. Nenhuma acao Git foi executada.
- Multi-secao: resolvida como backlog/future spec. Primeira fatia deve garantir apenas secao principal obrigatoria por `Content.sectionId` ou equivalente nativo; nao criar `ContentSection` nem migration de multi-secao nesta primeira fatia.
- Permissao granular de publicacao: resolvida como `contents.publish`. `contents.write` nao pode publicar, alterar status para `published`, alterar validade de publicacao ou arquivar conteudo publicado sem `contents.publish`. Seed idempotente minimo pode ser planejado se necessario, mas nao criado nesta etapa documental.
- FriendlyUrl dedicada: resolvida e aprovada como fonte de verdade para URL amigavel global. `FriendlyUrl.path` deve ser unico globalmente entre secao e conteudo; o campo publico canonico para Portal e `url`; `slug` e `section.path` permanecem auxiliares.
- Fluxo de migration: resolvido. Qualquer migration deve ser criada somente em dev via `npm run docker:dev:migrate -- nome_em_snake_case`; `local-prod` e `production` aplicam apenas migrations versionadas por fluxo apropriado. `prisma db push`, `prisma migrate reset`, SQL manual e correcoes diretas em local-prod/production continuam proibidos.

## Permanent Guards

- Nenhum PHP, SQL, HTML, CSS, JS, asset, cache, credencial, SMTP, IP, e-mail especifico, path absoluto ou configuracao antiga do legado deve ser copiado.

## Out of Scope for First Slice

- Newsletter.
- Ouvidoria.
- Tags.
- Conteudos relacionados.
- Anexos.
- Galerias.
- Workflow completo.
- Catalogo legado amplo de tipos.
- Blocos dinamicos avancados.
- Contador de visitas.
- Cache legado.

## Parallel Opportunities

- T010, T041, T042, T044, T045, T047, T048, T049, T050, T052, T053, T055 e T057 sao documentais/modelagem e podem ser preparados em paralelo apos suas dependencias.
- T033 e T034 podem ser analisadas em paralelo apos Fase 1, mas implementacao deve respeitar migrations/seeds.
- T058 e T059 podem rodar em paralelo depois que a primeira fatia estiver implementada.

## Format Validation

Todas as tasks usam o formato checklist `- [ ] T### [P?] [US?] Descricao com caminho de arquivo`, seguido de metadados obrigatorios: Tipo, Fase, Prioridade, Status, Objetivo, Escopo, Fora de escopo, Arquivos/modulos provaveis, Regras de negocio cobertas, Dependencias, Migration, Seed, Testes obrigatorios, Criterios de aceite, Riscos, Validacoes, Documentacao e Observacoes.
