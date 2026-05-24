# Data Model: Portabilidade de regras de negocio do CMS legado ICHC

Este documento descreve impacto de modelo da feature. As subfatias 1C, 1D e T024 criaram somente as migrations versionadas de validade editorial, FriendlyUrl e `Section.accessPolicy`; migrations futuras continuam proibidas sem autorizacao explicita.

## Existing Entities

### User

Campos relevantes atuais: `email`, `username`, `cpf`, `status`, `isActive`, `roles`, `authSessions`.

Regras planejadas:

- Autentica somente com `status = "Ativo"` e `isActive = true`.
- CPF, e-mail e username continuam unicos.
- Status legados observados continuam documentados, mas nao viram novo enum tecnico na primeira fatia.

### Role

Campos relevantes atuais: `name`, `functionName`, `status`, `parentRoleId`, `permissions`, `sectionAccesses`, `contentTypeAccesses`.

Regras planejadas:

- `functionName` representa funcao editorial quando necessario.
- `parentRoleId` fica como base para workflow futuro.
- Permissao granular de publicacao foi registrada como permissao nativa `contents.publish` no seed bootstrap idempotente, nao como string legada.

### Permission and Accesses

Modelos atuais: `Permission`, `RolePermission`, `RoleApplicationAccess`, `RoleSectionAccess`, `RoleContentTypeAccess`.

Regras planejadas:

- `Permission` continua protegendo controllers via `PermissionsGuard`.
- `contents.publish` e a permissao granular oficial para publicar, alterar para `published`, alterar validade de conteudo publicado e arquivar conteudo publicado.
- `RoleApplicationAccess` continua representando `canCreate`, `canUpdate`, `canDelete`, `canAccess`.
- Auditar pode exigir permissao futura se virar operacao administrativa.

### Section

Campos atuais: `parentId`, `name`, `slug`, `path`, `description`, `order`, `visits`, `visibleInMenu`, `isActive`, `accessPolicy`.

Campo implementado na T024:

- `accessPolicy`: `public`, `restricted_visible`, `restricted_hidden`, com default `public`.

Campos provaveis futuros:

- Campos futuros condicionais: `linkType`, `linkUrl`, `openInNewWindow`, `imageId`, `responsibleRoleId`.

Validacoes:

- `path` e `slug` continuam normalizados.
- Menu publico considera `isActive`, `visibleInMenu`, `order`, hierarquia e `accessPolicy`.
- T024 modelou `Section.accessPolicy`; T023 implementou a filtragem do menu publico no backend. Secoes `public` e `restricted_visible` podem aparecer no menu publico; `restricted_hidden` nao aparece.

### Content

Campos atuais: `title`, `slug`, `excerpt`, `body`, `status`, `visibility`, `publishedAt`, `validFrom`, `validUntil`, `validateValidity`, `contentTypeId`, `sectionId`, `seoId`, `authorId`, `featuredMediaId`.

Campos implementados na subfatia 1C:

- `validFrom`.
- `validUntil`.
- `validateValidity` boolean.

Campos provaveis futuros:

- `contentDate` ou equivalente para data editorial do conteudo.
- Opcional `archivedAt` apenas se o time quiser data de arquivamento separada.

Validacoes:

- `sectionId` permanece obrigatorio.
- `status` publico deve usar `draft`, `published`, `archived`.
- Subfatia 1B implementa a public policy com `status = "published"`, `visibility = "public"`, secao ativa e `Section.accessPolicy = "public"`.
- `restricted_visible` permanece semantica de menu publico; nao libera conteudo publico ate existir policy/autorizacao especifica de rota/conteudo. `restricted_hidden` permanece bloqueado para endpoints publicos.
- Subfatia 1C implementa validade editorial na public policy: se `validateValidity = false`, o conteudo publicado aparece independentemente do intervalo; se `validateValidity = true`, o conteudo aparece apenas quando a data atual esta dentro de `validFrom`/`validUntil`.
- Data final de validade e interpretada ate fim do dia quando nao houver horario explicito, usando o inicio do dia atual na comparacao com `validUntil`.
- Migration criada/aplicada em dev: `apps/api/prisma/migrations/20260524005604_add_content_editorial_validity/migration.sql`.
- Subfatia T027 implementou fallback SEO no payload publico: SEO especifico prevalece; se ausente, backend gera `title`, `description`, `canonicalUrl` e `robots` seguros, com sanitizacao de HTML e valores sensiveis conhecidos.
- Subfatia T030 atualizou o contrato compartilhado: `PublicContent.seo` e obrigatorio no payload publico; `PublicContent.url` e `section.url` sao campos canonicos opcionais ate a resolucao publica por FriendlyUrl ser expandida; `AdminContent` e `UpsertContentRequest` expõem `validFrom`, `validUntil` e `validateValidity`.
- Subfatia T031 atualizou o Portal para preferir `content.url` quando presente, manter fallback por slug e tratar detalhe `404` como ausencia segura.

### ContentSection (backlog/future spec)

Decisao humana: multi-secao fica fora da primeira fatia. Nao criar `ContentSection` nem migration de multi-secao nesta primeira fatia. A primeira fatia garante apenas secao principal obrigatoria por `Content.sectionId` ou equivalente nativo existente.

Campos provaveis para future spec:

- `contentId`.
- `sectionId`.
- `kind`: `primary` ou `associated`, ou boolean equivalente.

Regras futuras:

- A secao principal em `Content.sectionId` deve sempre existir tambem na associacao.
- Backfill deve criar associacao primaria para conteudos existentes.
- A regra legada de multiplas secoes permanece reconhecida, mas diferida.

### FriendlyUrl

Entidade dedicada implementada na subfatia 1D como fonte de verdade planejada para URL amigavel global. Migration criada/aplicada em dev: `apps/api/prisma/migrations/20260524014757_add_friendly_urls/migration.sql`.

Campos implementados:

- `id`.
- `path` unico global normalizado entre secao e conteudo.
- `targetType`: `section` ou `content`.
- `sectionId` opcional.
- `contentId` opcional.
- `primarySectionId` opcional para conteudo.
- `isActive`.
- `createdAt`, `updatedAt`.

Indices/regras:

- Unicidade global em `path`.
- `sectionId`, `contentId` e `primarySectionId` sao relacionamentos opcionais.
- Validar duplicidade antes de salvar secao/conteudo.
- Criacao/atualizacao de secao mantem `FriendlyUrl` com `targetType = "section"` e `path = Section.path`.
- Criacao/atualizacao de conteudo mantem `FriendlyUrl` com `targetType = "content"` e `path` canonico normalizado do slug atual; `primarySectionId` guarda a secao principal.
- Backfill de registros existentes nao foi executado nesta subfatia; deve ser future task controlada se necessario.
- Campo publico canonico para Portal: `url`.
- `slug` e `section.path` podem permanecer como dados auxiliares, mas nao sao fonte de verdade para colisao global.
- Resolucao publica por FriendlyUrl, redirect e alteracao de rotas do portal nao foram implementadas nesta subfatia.
- O campo `url` foi refletido no contrato compartilhado e no consumo do Portal como canonico quando disponivel; `FriendlyUrl.path` permanece a fonte de verdade de colisao global.

### ContentType

Campos atuais: `name`, `slug`, `schemaJson`, `allowRichText`, `allowFeaturedMedia`.

Regras planejadas:

- Primeira fatia usa tipo generico/minimo existente.
- Fase 3 valida campos obrigatorios no backend com base em `schemaJson`.
- Catalogo legado amplo nao deve ser seedado sem decisao de produto.

### SeoMetadata

Campos atuais: `title`, `description`, `keywords`, `canonicalUrl`, `robots`, `imageId`.

Regras planejadas:

- SEO especifico prevalece quando existir.
- Fallback usa titulo/excerpt do conteudo ou nome de secao.
- Imagem social fica para fase futura se depender de midia.

### MediaAsset

Campos atuais: `filename`, `mimeType`, `sizeInBytes`, `storageKey`, `altText`, `caption`, `isPublic`, `lgpdRestricted`.

Regras planejadas:

- Base para anexos/galerias futuras.
- Primeira fatia nao cria anexos nem galeria.

### Newsletter

Modelos atuais: `NewsletterCampaign`, `NewsletterGroup`, `NewsletterRecipient`, `NewsletterDispatch`.

Regras planejadas:

- Fora da primeira fatia.
- Envio/log real requer decisao de produto e validacao SMTP por ambiente.
- Nao migrar configuracao SMTP legada.

### PrivacyRequest / Ouvidoria

`PrivacyRequest` cobre LGPD, nao ouvidoria. Ouvidoria formal precisa future spec.

### AuditLog

Campos atuais: `actorId`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`, `userAgent`, `createdAt`.

Regras implementadas ate T028:

- Primeira fatia audita mudancas criticas: publicar, arquivar, mudar URL, mudar validade, mudar secao principal e alterar politica de secao.
- Eventos atuais: `content.published`, `content.archived`, `content.url_changed`, `content.validity_changed`, `content.primary_section_changed`, `section.access_policy_changed`.
- Metadata nao contem segredo, corpo HTML sensivel desnecessario ou credenciais.

## State Mapping

Subfatia 1A implementada sem criar enum legado, sem criar campo `legacyStatus` e sem alterar schema. Os contratos nativos continuam limitados a `draft`, `published` e `archived`.

| Termo legado | Estado Refresh | Primeira fatia |
|---|---|---|
| `Publicado` | `published` | Exibido se validade e acesso permitirem |
| `Novo` | `draft` | Nao publico |
| `Rascunho` | `draft` | Nao publico |
| `Excluido` | `archived` | Nao publico, exclusao logica |
| `Complemento` | A definir | Fora da primeira fatia |

## Migration Candidates

1. `add_content_editorial_validity` - criada em dev como `20260524005604_add_content_editorial_validity`.
2. `add_friendly_urls` - criada em dev como `20260524014757_add_friendly_urls`.
3. `add_section_access_policy` - criada em dev como `20260524040920_add_section_access_policy`.
4. `add_content_sections` (backlog/future spec; fora da primeira fatia)
5. `seed_contents_publish_permission` - concluido em T025 no seed bootstrap idempotente, sem migration estrutural.

Cada migration futura deve ser criada somente em dev via `npm run docker:dev:migrate -- nome_em_snake_case`, com backfill idempotente quando aplicavel, testes de migration e rollback documentado como migration versionada. `prisma db push`, `prisma migrate reset`, SQL manual e correcoes diretas em local-prod/production continuam proibidos.
