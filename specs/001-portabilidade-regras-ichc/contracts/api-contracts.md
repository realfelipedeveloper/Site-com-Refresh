# API Contracts: Portabilidade de regras de negocio do CMS legado ICHC

Contratos planejados para implementacao futura. Este arquivo nao altera API runtime.

## Public Content Policy

Todos os endpoints publicos que retornam conteudo devem aplicar a mesma policy:

- `status = "published"`.
- Conteudo nao arquivado/excluido logicamente.
- `visibility = "public"` ou politica equivalente permitida.
- Secao principal ativa.
- Secao principal com `accessPolicy = "public"`.
- `restricted_visible` e permitido no menu publico, mas nao libera conteudo publico enquanto nao houver policy/autorizacao especifica de rota/conteudo.
- `restricted_hidden` nunca deve vazar em endpoints publicos de conteudo.
- Se `validateValidity = true`, data atual entre `validFrom` e `validUntil`.
- Se `validateValidity = false`, conteudo `published` aparece independentemente do intervalo.
- SEO especifico prevalece quando existir.
- Quando SEO especifico estiver ausente, o backend fornece fallback basico com `title`, `description`, `canonicalUrl` e `robots`, sanitizando HTML e valores sensiveis conhecidos.

## Canonical Public URL

Fonte de verdade planejada e aprovada para a primeira fatia: `FriendlyUrl.path` ativo. A subfatia 1D implementou persistencia e validacao de escrita, mas nao criou endpoint publico novo, redirect ou alteracao de rota do Portal.

Regras para consumo pelo Portal:

- Respostas publicas de conteudo e secao devem expor `url` como URL amigavel canonica.
- `url` deve ser derivada de `FriendlyUrl.path`.
- O Portal deve preferir `url` para navegacao e links internos quando o campo estiver presente; enquanto a resolucao publica por FriendlyUrl nao existir, o fallback seguro continua sendo `/${slug}` para conteudo.
- `slug` e `section.path` podem continuar no payload como dados auxiliares, mas nao devem ser usados como fonte de verdade para detectar colisao global.
- `FriendlyUrl.path` deve ser unico globalmente entre secao e conteudo.

## GET /api/v1/contents

Uso: lista publica inicial do portal.

Resposta deve conter apenas conteudos publicados e acessiveis.

Campos minimos:

```json
{
  "id": "content-id",
  "title": "Titulo",
  "slug": "titulo",
  "url": "/noticias/titulo",
  "excerpt": "Resumo",
  "body": "Texto",
  "publishedAt": "2026-05-23T12:00:00.000Z",
  "section": {
    "id": "section-id",
    "name": "Secao",
    "path": "/noticias",
    "url": "/noticias"
  },
  "seo": {
    "title": "Titulo SEO",
    "description": "Descricao SEO",
    "canonicalUrl": null,
    "robots": "index,follow"
  }
}
```

Contrato compartilhado atualizado na T030:

- `PublicContent.url` e `PublicContent.section.url` sao opcionais para compatibilidade ate a API expor a URL canonica em todos os payloads publicos.
- `PublicContent.seo` e obrigatorio no contrato publico porque o backend fornece fallback basico quando SEO especifico nao existe.
- `AdminContent` e `UpsertContentRequest` incluem `validFrom`, `validUntil` e `validateValidity` para a validade editorial implementada na primeira fatia.

## GET /api/v1/contents/:slug

Uso: detalhe publico legado atual por slug.

Regra planejada para T023:

- Deve retornar `404` para `draft`, `archived`, restrito, inativo ou fora de validade.
- Deve usar a mesma public policy de listas.
- Pode ser substituido ou complementado por resolucao global de URL.

## GET /api/v1/sections

Uso: menu/arvore publica.

Regra implementada na T023:

- Retornar apenas secoes ativas.
- Respeitar `visibleInMenu`.
- Respeitar `accessPolicy`: `public` e `restricted_visible` aparecem; `restricted_hidden` nao aparece.
- Ordenar por `order`.
- Preservar hierarquia em todos os niveis elegiveis.
- Nao vazar secao `restricted_hidden` para usuario sem permissao.

Consumo do Portal atualizado na T031:

- O Portal consome `GET /api/v1/sections` como menu ja filtrado pelo backend.
- Links de conteudo preferem `content.url` quando presente.
- Detalhe publico que retorna `404` e tratado como `notFound()` no Portal, sem reproduzir layout legado.

Campo modelado/contratado na T024:

```json
{
  "id": "section-id",
  "name": "Secao",
  "slug": "secao",
  "path": "/secao",
  "url": "/secao",
  "accessPolicy": "public",
  "children": []
}
```

Notas T024/T023:

- `accessPolicy` ja e campo planejado/nativo de `Section`, com valores `public`, `restricted_visible` e `restricted_hidden`.
- `restricted_visible` apenas indica que a secao pode aparecer publicamente; autorizacao de acesso ao conteudo/rota deve ser tratada por policy futura.
- `restricted_hidden` nao aparece no menu publico apos T023.
- T023 aplica a regra no backend; o Portal deve consumir o menu ja filtrado pela API.

## Friendly URL Resolution

Endpoint ou service futuro recomendado. Nao implementado na subfatia 1D:

```text
GET /api/v1/friendly-urls/resolve?path=/noticias/titulo
```

Resposta planejada:

```json
{
  "type": "content",
  "path": "/noticias/titulo",
  "url": "/noticias/titulo",
  "section": {
    "id": "section-id",
    "path": "/noticias",
    "url": "/noticias",
    "name": "Noticias"
  },
  "content": {
    "id": "content-id",
    "slug": "titulo",
    "url": "/noticias/titulo",
    "title": "Titulo"
  }
}
```

Erros:

- `404` quando URL nao existir, alvo estiver inativo, conteudo nao for publico ou secao nao for acessivel.
- `409` em escrita quando uma URL duplicada for solicitada.

## Admin Content Write

Endpoints atuais:

- `POST /api/v1/contents/admin`
- `PATCH /api/v1/contents/admin/:id`
- `DELETE /api/v1/contents/admin/:id`

Regras implementadas ate T026:

- `contents.write` pode criar/editar rascunho.
- `contents.publish` e a permissao granular oficial para publicar, alterar status para `published`, alterar validade de publicacao ou arquivar conteudo publicado.
- `contents.write` sem `contents.publish` nao pode executar essas operacoes.
- O backend retorna `403`/`Forbidden` para operacoes de publicacao sem `contents.publish`, sem persistir a alteracao.
- Backend rejeita URL global duplicada antes de persistir.
- Backend deve validar secao principal, tipo de conteudo e escopo de perfil.
- Backend cria revisao e auditoria minima para mudancas criticas implementadas ate T028.

## Audit Events

Eventos minimos implementados ate T028:

- `content.published`.
- `content.archived`.
- `content.url_changed`.
- `content.validity_changed`.
- `content.primary_section_changed`.
- `section.access_policy_changed`.

Cada evento usa `AuditLog` com `actorId` quando disponivel, `action`, `entityType`, `entityId`, `createdAt` do modelo e `metadata` minima. A metadata nao deve conter senha, token, segredo, corpo HTML completo, `.env`, credenciais ou payload legado sensivel.

## Admin Section Write

Endpoints atuais:

- `POST /api/v1/sections/admin`
- `PATCH /api/v1/sections/admin/:id`
- `DELETE /api/v1/sections/admin/:id`

Regras atuais/futuras:

- Backend valida URL global em criacao/alteracao.
- `accessPolicy` pode ser enviado em criacao/alteracao com valores `public`, `restricted_visible` ou `restricted_hidden`; quando omitido, o default e `public`.
- Atualizar paths descendentes.
- Preservar relacionamentos ou bloquear/remover conforme politica aprovada.
- Auditar mudanca de visibilidade, acesso e URL.

## Search Contract (future)

```text
GET /api/v1/search?q=termo&page=1&pageSize=10&sectionPath=/noticias
```

Regras:

- Fase 4.
- Buscar apenas conteudos publicados e acessiveis.
- Respeitar arvore de secao quando filtro for informado.
- Retornar URL amigavel quando existir.

## Newsletter and Ouvidoria Contracts

Newsletter e ouvidoria nao fazem parte da primeira fatia. Nenhum contrato de envio, SMTP, manifestacao ou resposta deve ser implementado sem decisao formal de produto e spec futura.
