# Implementation Plan: Portabilidade de regras de negocio do CMS legado ICHC

**Branch atual/documentada**: `refactor/business-rules` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-portabilidade-regras-ichc/spec.md` and checklist from `specs/001-portabilidade-regras-ichc/checklists/requirements.md`.

**Planning status**: Primeira fatia T007-T032 e T064-T065 implementada e validada. Este plano agora e historico para a primeira fatia e guia de backlog para fases futuras; nao deve ser usado como autorizacao para executar todas as tasks pendentes de uma vez.

## Summary

Planejar a portabilidade incremental das regras de negocio extraidas do CMS legado ICHC para o Refresh, usando o legado apenas como fonte de comportamento. A primeira fatia recomendada protege publicacao e roteamento publico: login apenas para usuario `Ativo`, status nativos `draft`/`published`/`archived`, filtros publicos compartilhados, validade editorial, `FriendlyUrl` global, secao principal obrigatoria via `Content.sectionId`, menu seguro, permissao granular `contents.publish`, SEO fallback e auditoria minima.

Este plano nasceu como etapa documental. A primeira fatia foi implementada posteriormente em subfatias autorizadas; fases futuras continuam sem autorizacao automatica para runtime, banco, migration, Docker, Compose, script, workflow, template, commit, push, merge, deploy ou acao Git.

## Planning Stabilization Note

A primeira fatia foi validada, mas o fluxo gerou retrabalho porque o plano original ficou amplo demais e o `tasks.md` acumulou quatro papeis: governanca, backlog executavel, historico de implementacao e roadmap futuro. Para evitar repetir esse problema:

- Nao executar `$speckit-implement` contra o `tasks.md` inteiro desta feature.
- Para qualquer fase futura, gerar uma subfatia autorizada ou nova spec menor com escopo fechado, testes e criterios de aceite proprios.
- Separar readiness/governanca de tasks runtime; pre-condicoes documentais nao devem competir com tasks implementaveis.
- Tasks TDD em red devem deixar claro se o concluido significa "teste criado" ou "comportamento entregue".
- Depois de cada subfatia, normalizar apenas o status essencial; evitar lapidacao documental infinita.
- O bug corrigido apos T032 mostrou uma lacuna de planejamento real: public policy de conteudo deve considerar `Section.accessPolicy = "public"`; `restricted_visible` e semantica de menu, nao autorizacao publica de conteudo.

## Technical Context

**Language/Version**: TypeScript; Node `>=20.11.0`; NestJS API; Next.js 14 App Router no Portal e no Refresh admin.

**Primary Dependencies**: NestJS, Prisma Client 5, MySQL 8, Next.js, React, `@abbatech/contracts`, `class-validator`, `helmet`, `@nestjs/throttler`, Argon2, MinIO, Nodemailer, Vitest, Playwright.

**Storage**: MySQL 8 via Prisma em `apps/api/prisma/schema.prisma`; MinIO/S3 para midia; cookies HttpOnly e sessoes opacas em `AuthSession`.

**Testing**: Vitest para unitarios, integracao leve, regressao e seguranca; Playwright para E2E; scripts de smoke e migration test.

**Target Platform**: Monorepo web com API NestJS (`api/v1`), Portal Next em `/abbatech/portal` e Refresh admin Next em `/abbatech/refresh`.

**Project Type**: Web application monorepo com workspaces `apps/*` e `packages/*`.

**Performance Goals**: Manter consultas publicas de conteudo, menu e URL com filtros indexaveis por status, secao, slug/path e validade; paginacao obrigatoria em listas publicas futuras.

**Constraints**: Nao copiar tecnologia legada; nao criar CMS paralelo; preservar subpaths e contratos de build; migrations apenas versionadas em dev; nenhuma mudanca de production sem instrucao explicita; nenhuma credencial ou configuracao antiga do legado.

**Scale/Scope**: Feature ampla, mas implementacao deve ser fatiada. Primeira fatia limita o blast radius a publicacao, roteamento, menu, permissao de publicacao, SEO fallback e auditoria minima.

## Constitution Check

**Spec-Driven Development obrigatorio**: PASS. A feature possui spec, checklist e clarificacoes antes de plano. O plano registra DP-001 resolvida por excecao formal humana e mantem os demais blockers antes de implementacao.

**GitFlow e acoes Git explicitas**: PASS COM RESSALVA. A branch atual/documentada `refactor/business-rules` nao segue `feature/*`, `change/*` ou `fix/*`, mas DP-001 foi resolvida por excecao formal humana para esta feature/rodada. Nenhuma acao Git foi executada ou deve ser tomada automaticamente. A regra geral da Refresh Constitution 1.1.0 permanece preservada para futuras features, changes ou fixes.

**Ambientes Docker reprodutiveis**: PASS. O plano nao altera Docker/Compose. Validacoes futuras separam `dev`, `local-prod` e production.

**Rotas, subpaths e contratos de build**: PASS. O plano preserva `/abbatech/portal`, `/abbatech/refresh`, API interna `api/v1` e API publica `/abbatech/api`.

**Prisma, MySQL e migrations versionadas**: PASS. A primeira fatia criou migrations versionadas em dev para validade editorial, `FriendlyUrl` e `Section.accessPolicy`. Futuras migrations devem ser criadas somente em dev via fluxo oficial, nunca por `prisma db push`, `prisma migrate reset` ou SQL manual.

**Seguranca, autenticacao, sessao e dados**: PASS COM RESSALVA. A primeira fatia toca auth, permissao e publicacao publica, portanto exige testes reforcados para nao vazar conteudo nao publicado, restrito, excluido ou fora de validade.

**Testes automatizados por risco**: PASS. O plano define testes unitarios, integracao, regressao, seguranca, migrations, smoke e E2E.

**Documentacao tecnica auditavel**: PASS. Este plano, `research.md`, `data-model.md`, `contracts/` e `quickstart.md` formam trilha auditavel; docs versionadas em `docs/` devem respeitar o `.gitignore`.

**Segredos, dumps, backups, `.env` real ou arquivos locais**: PASS. Apenas exemplos de env foram lidos como contrato; nenhum segredo real deve ser versionado ou copiado do legado.

**Extension hooks**: `.specify/extensions.yml` define hooks opcionais de commit antes/depois de plan. Eles foram tratados como bloqueados pela instrucao explicita do usuario: nao fazer commit nem qualquer acao Git.

### Post-Design Constitution Check

Primeira fatia concluida com ressalvas de processo: os gates passaram, mas fases futuras exigem nova autorizacao humana e escopo menor. O plano permanece valido como trilha auditavel e backlog, nao como fila automatica de implementacao.

## Entity Coverage

| Dominio legado | Entidade/modelo Refresh existente | Estado | Observacao |
|---|---|---|---|
| Usuario | `User`, `AuthSession`, `PasswordResetToken` | Parcial | Identidade, status, CPF/e-mail/username e sessao existem; login precisa ser estrito para `Ativo`. |
| Perfil | `Role`, `UserRole`, `Role.parentRoleId`, `Role.functionName` | Parcial | Hierarquia e funcao existem; falta taxonomia editorial aplicada a publicacao/workflow. |
| Permissao | `Permission`, `RolePermission`, `RoleApplicationAccess`, `PermissionsGuard` | Parcial | Guards existem por codigo simples; acoes granularizadas existem em app access mas nao governam todos os controllers. |
| Secao | `Section`, `RoleSectionAccess` | Parcial | Arvore, path, ordem, visibilidade e escopo por perfil existem; falta politica publica explicita. |
| Conteudo | `Content`, `ContentRevision` | Parcial | Status, secao principal, tipo, autor, SEO, template e revisao existem; falta validade, URL global e public policy compartilhada. |
| Tipo/Mascara | `ContentType.schemaJson` | Parcial | Permite configuracao; falta validacao backend por schema aprovado. |
| URL amigavel | `Section.slug/path`, `Content.slug` | Parcial | Unicidade separada por entidade; falta unicidade global e resolucao central. |
| SEO | `SeoMetadata` | Parcial | SEO e fallback basico existem no service; precisa contrato publico consistente. |
| Tags | Nenhuma entidade dedicada encontrada | Ausente | Backlog/future spec. |
| Anexos | `MediaAsset` e `UploadService` como base | Parcial | Midia existe para foto/featured; falta relacao de anexos de conteudo. |
| Galerias | `MediaAsset` como base | Ausente/parcial | Falta modelo de galeria/imagens vinculadas a conteudo. |
| Workflow | `Role.parentRoleId`, `Content.authorId`, `ContentRevision` como base | Ausente/parcial | Falta evento/comentario/destinatario/notificacao. |
| Newsletter | `NewsletterCampaign`, `NewsletterGroup`, `NewsletterRecipient`, `NewsletterDispatch` | Parcial | CRUD existe; envio/log completo fica fora da primeira fatia. |
| Ouvidoria | `PrivacyRequest` cobre LGPD, nao ouvidoria | Ausente | Fora da primeira fatia; requer decisao formal de produto. |
| Auditoria | `AuditLog` | Parcial | Modelo existe e usado em recuperacao de senha; falta cobertura para alteracoes criticas de conteudo/secao. |

## Rule Coverage

**Ja existem e devem ser preservadas**: multi-perfil de usuario; unicidade por e-mail/username/CPF no schema e service; arvore de secoes; atualizacao de paths descendentes; status nativos de conteudo no contrato; revisao em salvamento de conteudo; SEO com fallback basico; guards de auth/permissao; upload seguro de imagem de usuario; modelos parciais de newsletter; `AuditLog`; subpaths e API prefix.

**Existem parcialmente e precisam ajuste**: autenticacao por status; permissao granular de publicar; filtro publico de conteudo; detalhe publico por slug; validade editorial; unicidade global de URL; menu publico com politica de acesso; escopo de secao por perfil; mascara validada no backend; exclusao logica de conteudo; auditoria de conteudo/secao.

**Ausentes**: entidade global `FriendlyUrl`; validade editorial ativa/inativa; relacao multi-secao de conteudo; politica publica explicita de secao; tags; anexos de conteudo; galerias; workflow editorial completo; envio real de newsletter; ouvidoria formal.

**Fora da primeira fatia**: newsletter, ouvidoria, tags/relacionados, anexos, galerias, workflow completo, catalogo legado amplo de tipos, blocos dinamicos avancados, contador de visitas e cache.

**Backlog/future spec**: conteudos relacionados, SEO avancado/tagging, anexos/galerias, workflow completo, newsletter envio/log/aprovacao, ouvidoria, tipos condicionais (`Noticias`, `Documentos/Publicacoes`, `Banner`, `Licitacoes`, `FAQ`, etc.).

## Legacy Naming Translation

| Nome legado | Nome idiomatico Refresh recomendado | Observacao |
|---|---|---|
| `Publicado` | `published` | Unico estado publico. |
| `Novo` | `draft` | Nao publico; representa desenvolvimento/encaminhamento inicial. |
| `Rascunho` | `draft` | Nao publico; nao criar estado separado na primeira fatia. |
| `Excluido` | `archived` | Exclusao logica para conteudo com historico. |
| `Complemento` | Future spec | Nao usar como status publico; decidir se vira tipo, relacao ou visibilidade. |
| `Livre` | `public` | Secao visivel e acessivel publicamente. |
| `Restrita_Aparente` | `restricted_visible` | Pode aparecer no menu, mas acesso exige permissao/login. |
| `Restrita` | `restricted_hidden` | Nao aparece nem acessa sem permissao. |
| `Mascara` | `ContentType` | Usar `schemaJson` e validacoes nativas. |
| `URL amigavel` | `FriendlyUrl` | Entidade dedicada aprovada como fonte de verdade. |
| `Aplicativo` administrativo | `SystemApplication` | Manter nomenclatura de dominio atual do Refresh. |
| `Ouvidoria` | Future spec formal | Nao mapear automaticamente para `PrivacyRequest`. |

## Phase Plan

### Fase 0 - Apenas analise, documentacao e validacao da spec

- Confirmar decisoes do `$speckit-clarify`.
- Registrar DP-001 como resolvida por excecao formal humana, sem executar acoes Git.
- Nao implementar runtime.
- Nao criar migration.
- Nao alterar banco.
- Nao executar acoes Git.

### Fase 1 - Protecao de publicacao e roteamento publico

Inclui somente:

- Autenticacao apenas para usuario `Ativo`.
- Vocabulario nativo `draft`, `published`, `archived`.
- Mapeamento legado: `Publicado` -> `published`; `Novo`/`Rascunho` -> `draft`; `Excluido` -> `archived`; `Complemento` fora da fatia.
- Filtro publico compartilhado para listas, detalhe, URL e futura busca.
- Validade editorial ativa/inativa, incluindo fim do dia.
- URL amigavel global.
- Secao principal obrigatoria.
- Multi-secao fora da primeira fatia; garantir apenas secao principal obrigatoria por `Content.sectionId` ou equivalente nativo.
- Menu publico por hierarquia, ordem, visibilidade e politica de acesso.
- Permissao granular de publicacao.
- SEO fallback basico.
- Auditoria minima para alteracoes criticas.

### Fase 2 - Permissoes, secoes e controle de acesso publico

- Traduzir `Livre`, `Restrita_Aparente`, `Restrita` para `public`, `restricted_visible`, `restricted_hidden` ou equivalente.
- Aplicar escopo por perfil/secao com `RoleSectionAccess`.
- Bloquear backend por permissao, nao apenas UI.
- Garantir menu publico seguro para secoes restritas.

### Fase 3 - Tipos de conteudo/mascaras

- Usar tipo minimo/generico existente na primeira rodada.
- Nao reproduzir catalogo legado inteiro.
- Validar campos obrigatorios no backend a partir de `ContentType.schemaJson`.
- Deixar tipos condicionais para fases futuras.

### Fase 4 - Busca publica e blocos/listagens

- Busca somente em conteudos publicados e acessiveis.
- Paginacao e ordenacoes seguras.
- Reuso da politica compartilhada em listas, detalhes, blocos e busca.

### Fase 5 - SEO avancado, tags, anexos e galerias

- Planejar apenas como fase futura.
- Nao incluir na primeira fatia.
- Reutilizar `MediaAsset` e `UploadService` quando virar escopo aprovado.

### Fase 6 - Workflow editorial completo

- Planejar apenas como fase futura.
- Nao incluir na primeira fatia.
- Usar hierarquia de `Role.parentRoleId` e evento/comentario proprio quando aprovado.

### Fase 7 - Newsletter

- Fora da primeira fatia.
- Entra somente com decisao explicita de produto.
- Nao migrar SMTP, senhas, e-mails especificos ou configuracoes antigas.

### Fase 8 - Ouvidoria/contato

- Fora da primeira fatia.
- Entra somente com decisao formal de produto.
- Considerar LGPD, dados pessoais, protocolo, notificacao e retencao.

### Fase 9 - Auditoria, historico e hardening

- Consolidar auditoria.
- Confirmar logs sem segredo.
- Confirmar cobertura de testes e documentacao.
- Rodar validacoes de ambiente antes de PR/deploy, conforme escopo implementado.

## Mandatory Matrix

| Regra | Estado no Refresh | Arquivos/modulos relacionados | Mudanca proposta | Migration? | Seed? | Testes | Risco | Fase sugerida |
|---|---|---|---|---|---|---|---|---|
| Login apenas para usuario `Ativo` | Parcial | `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/management/management-users.service.ts` | Bloquear qualquer status diferente de `Ativo`; alinhar recuperacao de senha | Nao | Nao | Unitario/seguranca auth | Alto | 1 |
| Login por CPF/e-mail/username | Parcial | `AuthService.login`, `ManagementValidationService` | Manter CPF/e-mail/username; decidir se login por `name` sai | Nao | Nao | Unitario auth | Medio | 1 |
| Multi-perfil e perfil ativo | Ja atendida/parcial | `UserRole`, `AuthSession.roleId`, `AuthService.switchProfile` | Preservar e usar perfil ativo em policy editorial | Nao | Talvez | Unitario/integracao | Medio | 1-2 |
| Hierarquia de perfis | Parcial | `Role.parentRoleId` | Preservar para workflow futuro; nao usar na primeira fatia salvo escopo de permissao | Nao | Talvez | Unitario futuro | Medio | 6 |
| Funcoes Autor/Editor/Publicador/Administrador | Parcial | `Role.functionName`, seeds | Definir permissoes nativas; primeira fatia precisa `contents.publish` | Nao | Sim | Permissao/seguranca | Alto | 1 |
| Permissao administrativa por area/acao | Parcial | `Permission`, `RoleApplicationAccess`, `PermissionsGuard`, `ManagementController` | Planejar alinhamento entre `canAccess/canCreate/canUpdate/canDelete` e guards | Talvez | Sim | Integracao guards | Alto | 2 |
| Auditar como acao administrativa | Parcial | `AuditLog`, `Permission` | Criar regra/permissao se virar comportamento de UI/backend | Talvez nao | Sim | Unitario/integracao | Medio | 9 |
| Escopo perfil/secao | Parcial | `RoleSectionAccess`, `ContentsService.getRoleScope` | Reusar para publicacao e controle publico; diferenciar acesso/publicacao se necessario | Talvez | Talvez | Integracao | Alto | 2 |
| Secao em arvore com ordem/path | Ja atendida | `Section`, `SectionsService` | Preservar rebuild de paths | Nao | Nao | Regressao secao | Medio | 1-2 |
| Menu publico visivel/ativo/ordenado | Parcial | `SectionsService.listTree`, `SectionsController`, `Portal` | Aplicar `visibleInMenu`, `isActive`, hierarquia profunda e politica de acesso | Talvez | Nao | Integracao/portal | Alto | 1 |
| Secao `public/restricted_visible/restricted_hidden` | Ausente | `Section`, `RoleSectionAccess` | Adicionar politica publica explicita | Sim | Talvez | Integracao/seguranca | Alto | 1-2 |
| Links internos/externos/nova janela de secao | Ausente | `Section`, Portal | Backlog salvo se produto precisar na primeira fatia | Sim futura | Nao | Portal futuro | Baixo | Backlog |
| Remocao de secao e relacionamentos | Parcial | `SectionsService.remove` | Hoje bloqueia com filhos/conteudos; planejar cleanup apenas se regra aprovada | Talvez | Nao | Integracao | Medio | 2 |
| URL amigavel unica global | Ausente/parcial | `Section.slug/path`, `Content.slug` | Criar `FriendlyUrl` dedicado com unicidade global | Sim | Backfill | Integracao/migration | Alto | 1 |
| Resolver URL para secao/conteudo | Ausente/parcial | Portal `[slug]`, `ContentsController`, `SectionsController` | Criar service de resolucao publica ou endpoint dedicado | Sim | Backfill | Contrato/integracao/E2E | Alto | 1 |
| Geracao normalizada de slug | Ja atendida/parcial | `ContentsService.toSlug`, `SectionsService.toSlug`, `management.utils` | Unificar helper/policy para evitar divergencia | Nao | Nao | Unitario | Medio | 1 |
| Conteudo com secao principal obrigatoria | Ja atendida | `Content.sectionId`, DTOs | Preservar e testar | Nao | Nao | Unitario/integracao | Alto | 1 |
| Secao principal em secoes associadas | Ausente se multi-secao | `Content.sectionId` | Fora da primeira fatia; usar `Content.sectionId` e diferir `ContentSection` | Nao na primeira fatia | Nao | Futuro | Medio | Backlog |
| Publico exibe apenas `published` | Parcial | `ContentsService.listPublished`, `findBySlug` | Criar public policy compartilhada e aplicar em detalhe | Nao | Nao | Regressao/seguranca | Critico | 1 |
| Validade editorial ativa/inativa | Ausente | `Content` | Adicionar `validFrom`, `validUntil`, `validateValidity` ou nomes equivalentes | Sim | Backfill default | Unitario/integracao/migration | Critico | 1 |
| Data final ate fim do dia | Ausente | Futuro public policy | Normalizar comparacao no service | Nao | Nao | Unitario | Alto | 1 |
| Exclusao logica de conteudo | Parcial/ausente | `ContentsService.remove` | Usar `archived` para conteudo com historico/publicado; evitar delete fisico padrao | Talvez nao | Nao | Integracao | Alto | 1 |
| Revisao por salvamento | Ja atendida | `ContentRevision`, `ContentsService.createRevision` | Preservar; avaliar snapshot sem segredo | Nao | Nao | Regressao | Medio | 1 |
| Publicador controla publicacao | Ausente/parcial | `PermissionsGuard`, `ContentsController` | Separar `contents.write` de `contents.publish` | Nao | Sim | Seguranca/permissao | Critico | 1 |
| Listagem admin filtravel | Parcial | `ContentsService.listAdmin`, Refresh admin | Planejar filtros status/secao/tipo/autor/texto | Nao | Nao | Integracao/UI | Medio | 2 |
| Preview autenticado | Ausente | Portal/API futuro | Fora da primeira fatia salvo decisao | Talvez nao | Nao | Seguranca/E2E | Alto | Backlog |
| Mascara campos obrigatorios | Parcial | `ContentType.schemaJson`, `ManagementService` | Validar schema no backend em fase propria | Nao provavel | Seed tipo minimo | Unitario | Alto | 3 |
| Catalogo legado de tipos | Fora primeira fatia | `ContentType` | Nao reproduzir por inercia; usar generico/minimo | Nao | Talvez | Seed/integracao | Medio | 3/backlog |
| Listas/blocos com policy unica | Parcial | `ContentsService.listPublished`, Portal | Extrair policy compartilhada antes de busca/blocos | Nao | Nao | Regressao | Critico | 1/4 |
| Busca publica | Ausente | API/Portal futuros | Implementar apenas fase 4 com policy compartilhada | Talvez nao | Nao | Integracao/E2E | Alto | 4 |
| SEO especifico e fallback | Parcial | `SeoMetadata`, `ContentsService.upsertSeo`, contracts | Preservar fallback e expor consistentemente | Nao | Nao | Unitario/portal | Medio | 1 |
| Tags/metatags | Ausente | Nenhum modelo dedicado | Future spec | Sim futura | Talvez | Futuro | Baixo | 5 |
| Anexos de conteudo | Parcial | `MediaAsset`, `UploadService` | Future spec reusando midia existente | Sim futura | Nao | Seguranca/upload | Alto | 5 |
| Galerias | Ausente/parcial | `MediaAsset` | Future spec | Sim futura | Nao | Upload/portal | Medio | 5 |
| Workflow editorial | Ausente/parcial | `Role.parentRoleId`, `ContentRevision` | Future spec com evento/comentario/notificacao | Sim futura | Talvez | Integracao/notificacao | Alto | 6 |
| Newsletter envio/log | Parcial | `Newsletter*`, `ManagementNewslettersService` | Fora primeira fatia; nao migrar SMTP legado | Talvez futura | Talvez | Integracao/email | Alto | 7 |
| Ouvidoria/contato | Ausente | `PrivacyRequest` somente LGPD | Fora primeira fatia; decisao formal de produto | Sim futura | Talvez | LGPD/seguranca | Alto | 8 |
| Auditoria minima de conteudo/secao | Parcial | `AuditLog` | Registrar publish/archive/url/validity/section critical changes | Talvez nao | Nao | Integracao | Alto | 1/9 |

## Data Model Impact

Nenhuma mudanca de schema deve ocorrer nesta etapa. Migrations provaveis para implementacao futura:

- `Content`: adicionar validade editorial, por exemplo `contentDate`, `validFrom`, `validUntil`, `validateValidity`; opcionalmente `archivedAt` se `archived` exigir semantica temporal.
- `FriendlyUrl`: entidade dedicada aprovada como fonte de verdade, com `path` unico global, `targetType`, `sectionId`, `contentId`, `isActive`, timestamps e indices por alvo.
- `Section`: adicionar `accessPolicy` (`public`, `restricted_visible`, `restricted_hidden`) e, se aprovado, campos de navegacao (`linkType`, `linkUrl`, `openInNewWindow`, `imageId`, `responsibleRoleId`).
- `ContentSection`: backlog/future spec; nao criar na primeira fatia e nao criar migration de multi-secao agora.
- `Permission`/seed: incluir permissao nativa de publicacao `contents.publish`; seed idempotente minimo pode ser planejado se necessario, mas nao criado nesta etapa documental.
- Backlog: `Tag`, `ContentTag`, anexos/galerias vinculados a `MediaAsset`, `WorkflowEvent`, ouvidoria formal.

Menor mudanca de modelo para a primeira fatia: validade editorial em `Content`, entidade dedicada `FriendlyUrl`, `Section.accessPolicy` e possivel seed idempotente minimo de `contents.publish` se necessario. A associacao multi-secao fica fora da primeira fatia; `Content.sectionId` ou equivalente nativo e a secao principal ate future spec.

## Seed Impact

Seeds futuras devem ser idempotentes e restritas ao menor necessario:

- Fase 1: permissao oficial `contents.publish`; vinculo ao perfil Administrador/Publicador quando existir.
- Fase 1 ou 3: tipo de conteudo generico/minimo apenas se o bootstrap atual nao garantir um `ContentType` utilizavel.
- Fase 2: perfis/funcoes editoriais e escopos de secao apenas para testes ou bootstrap aprovado.
- Fases 7 e 8: nenhum seed de newsletter/ouvidoria sem decisao formal de produto.
- Production: seed demo/teste proibido; bootstrap apenas conforme politica existente e ambiente confirmado.

## API Impact

- `AuthService.login` e recuperacao de senha: aplicar status estrito `Ativo`.
- `ContentsService`: criar policy publica reutilizavel para `listPublished`, `findBySlug`, futura busca e blocos.
- `ContentsController`: separar escrita de publicacao, usando permissao especifica para mudar status para `published` ou controlar validade.
- `SectionsService`: aplicar politica de acesso e visibilidade no endpoint publico de menu.
- `SectionsController`: manter admin protegido por guards e validar futuras politicas de secao.
- `ManagementService` e DTOs: validar schema de mascara, permissoes e campos novos somente quando a fase correspondente entrar.
- `packages/contracts`: refletir novos campos publicos/admin sem expor detalhes legados.
- Novo service/endpoint possivel: resolucao de URL amigavel global, mantendo compatibilidade com rotas do Portal.

## Frontend/Portal Impact

- Portal deve consumir somente endpoints publicos ja filtrados no backend.
- Portal deve preservar `/abbatech/portal` e links relativos ao `basePath`.
- Detalhe publico atual por slug deve passar a usar resolucao/policy segura, evitando conteudo `draft`, `archived`, restrito ou fora de validade.
- Refresh admin deve exibir campos novos apenas quando backend/contracts estiverem prontos.
- Nenhuma tela, layout, HTML, CSS ou JavaScript legado deve ser reproduzido.
- Para primeira fatia, UI deve ser minima e orientada a controles nativos do Refresh; regras ficam no backend.

## Testing Strategy

**Unitarios**:

- Status de usuario permitido no auth.
- Normalizacao de slug/URL.
- Policy publica de conteudo com status/validade/fim do dia.
- SEO fallback.
- Regra de permissao `contents.publish`.

**Integracao**:

- `GET /contents` e `GET /contents/:slug` nao vazam `draft`, `archived`, restrito ou fora de validade.
- `GET /sections` respeita hierarquia, ordem, visibilidade e politica.
- CRUD admin rejeita URL global duplicada.
- Alterar status para `published` exige permissao de publicacao.
- Auditoria registra alteracoes criticas.

**Regressao**:

- Caminhos de secao continuam sendo atualizados nos descendentes.
- Conteudo continua criando `ContentRevision`.
- Usuarios com CPF/e-mail/username duplicados continuam bloqueados.

**Seguranca**:

- Usuario nao `Ativo` nao autentica e nao recupera senha.
- Area administrativa continua bloqueada por `JwtAuthGuard`, `PermissionsGuard` e `@RequirePermissions`.
- Conteudo restrito/nao publicado nao vaza em portal, busca futura, detalhe ou menu.

**Migrations**:

- `npm run test:migrations` com validacao estatica.
- Validacao real somente com banco `test`/`ci` e `RUN_TEST_DATABASE=true`.
- Backfill de `FriendlyUrl`/validade deve ser idempotente e testado antes de PR.

**Smoke**:

- Health API `/api/v1/health`.
- Portal em `/abbatech/portal`.
- Refresh em `/abbatech/refresh`.
- Smoke de URL publica canonical quando a fase de URL entrar.

**E2E**:

- Login de usuario ativo/inativo.
- Publicador publica conteudo; visitante ve no portal.
- Autor/editor sem permissao nao publica.
- Conteudo fora de validade nao aparece.
- Secao restrita nao aparece/acessa sem permissao.

## Environment Validation

**dev**:

- Criar migrations futuras apenas em dev pelo fluxo oficial.
- Rodar `npm run typecheck`, `npm run lint`, testes unitarios/integracao relevantes e `npm run test:migrations`.
- Subir stack dev apenas quando necessario para validacao manual ou E2E.
- Validar Mailpit/MinIO somente se a fase tocar e-mail/upload.

**local-prod**:

- Aplicar apenas migrations versionadas com `migrate deploy`.
- Validar build standalone, subpaths e CORS em `4100`/`4101`/`4333`.
- Rodar smoke nao destrutivo e checar guards de banco.
- Nao rodar seed demo/teste sem instrucao explicita.

**production checklist futuro**:

- Nao criar migration em production.
- Validar `npm run docker:prod:config` sem despejar segredos.
- Aplicar somente migrations versionadas e revisadas.
- Smoke nao destrutivo em health, portal e refresh.
- Confirmar `AUTH_COOKIE_SECURE=true`, CORS publico restrito e nenhum SMTP/segredo legado.
- Plano de rollback aprovado antes de deploy.

## Documentation Plan

- Manter `spec.md`, este `plan.md`, `research.md`, `data-model.md`, `contracts/` e futuro `tasks.md` como trilha primaria.
- Documentacao tecnica de implementacao futura deve registrar objetivo, arquivos alterados, regras implementadas, migrations, seeds, testes, riscos, rollback e fluxo GitFlow.
- Como `docs/*` e ignorado por padrao, qualquer doc em `docs/` que precise versionar deve ser explicitamente liberada ou duplicada em artefato Spec Kit/PR.
- Documentar tabela legado -> Refresh para status, secoes, permissoes e tipos de conteudo.

## Risk and Rollback

**Riscos principais**:

- Exposicao publica de conteudo `draft`, `archived`, restrito, excluido ou fora de validade.
- Publicacao indevida por usuario sem permissao.
- Colisao de URL entre secao e conteudo.
- Migration com backfill incorreto em dados reais.
- Criar CMS paralelo ao reproduzir mascaras/templates legados.
- Copiar credenciais, SMTP ou configuracoes antigas.
- Quebrar subpaths, API publica ou contratos `NEXT_PUBLIC_*`.
- LGPD em newsletter/ouvidoria/anexos sem decisao de produto.

**Rollback por fase**:

- Fase 1: feature flags ou deploy reversivel para policy publica e URL; migration com backfill idempotente e rollback SQL revisado somente como migration versionada, nunca manual.
- Fase 2: manter default `public` para secoes existentes; rollback por migration versionada e seed reversivel de permissoes.
- Fase 3: manter tipo generico; nao remover tipos existentes; rollback por config/schemaJson.
- Fases 5-8: exigir specs proprias e plano de rollback especifico antes de tocar dados pessoais, upload ou e-mail.
- Qualquer rollback em production deve ser aprovado por responsavel humano, com backup e ambiente confirmado.

## Implementation Recommendation

**Branch desta feature por excecao formal**: `refactor/business-rules`. DP-001 foi resolvida por excecao humana porque a feature ja foi iniciada e documentada nessa branch. Nao criar/trocar branch automaticamente; futuras features, changes ou fixes devem voltar ao padrao `feature/*`, `change/*` ou `fix/*`.

**Primeiro commit sugerido futuro**: consolidar a primeira fatia em commit(s) revisados por humano apos revisar diff, status do workspace e ausencia de arquivos sensiveis. Nao autorizado por este plano.

**Primeira fatia implementada**: Fase 1 - Protecao de publicacao e roteamento publico. Ela reduziu o maior risco: vazamento publico e publicacao sem permissao.

**Status atual**: primeira fatia encerrada; tasks futuras ficam como backlog. Nao usar o `tasks.md` completo como entrada direta para nova execucao de `$speckit-implement`.

**Pre-condicoes para fases futuras**:

- Definir subfatia pequena ou nova spec antes de qualquer implementacao.
- Revisar status/diff do workspace antes de implementar, sem acao Git automatica.
- Confirmar working tree sem alteracoes alheias que afetem a proxima subfatia.
- Confirmar ausencia de arquivos sensiveis, segredos, dumps, backups, `.env` real ou artefatos legados.

**Decisoes resolvidas**: DP-001 resolvida por excecao formal humana; multi-secao fora da primeira fatia e backlog/future spec; permissao granular oficial `contents.publish`; entidade dedicada `FriendlyUrl` aprovada como fonte de verdade com campo publico `url`; migrations somente em dev via `npm run docker:dev:migrate -- nome_em_snake_case`.

## Project Structure

### Documentation (this feature)

```text
specs/001-portabilidade-regras-ichc/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contracts.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed*.ts
│   └── src/
│       ├── modules/auth/
│       ├── modules/contents/
│       ├── modules/sections/
│       ├── modules/management/
│       ├── modules/newsletters/
│       ├── modules/privacy/
│       └── modules/upload/
├── portal/
│   ├── app/
│   └── lib/
└── refresh/
    └── app/
packages/
└── contracts/
scripts/
tests/
docs/
```

**Structure Decision**: A feature deve permanecer no monorepo atual, com regras de dominio no backend NestJS, contratos compartilhados em `packages/contracts`, consumo publico no Portal e administracao no Refresh. Nao criar app, CMS, schema ou camada paralela para legado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Branch atual/documentada fora do padrao constitucional | Excecao formal humana registrada para esta feature/rodada em `refactor/business-rules` | Trocar/renomear branch agora violaria instrucao explicita do usuario e poderia divergir do workspace real; a regra geral segue preservada para futuras branches. |
| Entidade `FriendlyUrl` aprovada | Necessaria para unicidade global e resolucao unica entre secao e conteudo | Validacao cruzada entre `Section.slug/path` e `Content.slug` duplica regra e aumenta risco de colisao publica. |
