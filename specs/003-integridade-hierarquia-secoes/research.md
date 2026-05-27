# Research: Integridade de hierarquia e caminhos de secoes

**Feature**: `003-integridade-hierarquia-secoes`  
**Branch**: `feature/section-hierarchy-path-integrity`  
**Date**: 2026-05-25  
**Status**: Completed for planning

## Legacy Evidence Reviewed

- `legado/Manager/Secao.php`
- `legado/Manager/website.sql`

## Findings

- O legado representa ancestralidade de secao com `secao_dna`.
- O legado mantem um caminho/nome hierarquico em `secao_nome_ordem`.
- Quando a hierarquia muda, descendentes tem `secao_nome_ordem` e `secao_dna` recalculados.
- URLs amigaveis de secao sao validadas antes de salvar.
- A ordem de exibicao de irmaos usa `secao_ordem`.
- A arvore administrativa e montada por niveis de ancestralidade, mas o Refresh deve usar sua propria estrutura nativa.

## Decisions

### R-001: Use Refresh-native hierarchy

**Decision**: Use `Section.parentId`, `Section.path`, `Section.slug` and `Section.order`.

**Rationale**: Esses campos ja representam a mesma regra de negocio sem copiar `secao_dna` ou `secao_nome_ordem`.

**Alternatives considered**: Criar campos `dna` ou `nome_ordem`; rejeitado por reproduzir detalhe acidental do legado.

### R-002: Reject cycles before persistence

**Decision**: Reject self-parent and descendant-parent moves before update.

**Rationale**: Ciclos corrompem a arvore e podem causar recursao infinita em rebuild de paths/menu.

**Alternatives considered**: Tentar reparar depois; rejeitado por risco de persistencia parcial.

### R-003: Keep FriendlyUrl synchronized

**Decision**: Every affected section path change must synchronize its `FriendlyUrl`.

**Rationale**: `FriendlyUrl` is the approved source of global friendly URL truth from spec 001.

**Alternatives considered**: Deixar backfill para rotina separada; rejeitado para operacoes novas porque geraria estado inconsistente.

### R-004: No schema change expected

**Decision**: Plan without schema, migration or seed.

**Rationale**: The existing model already has parent, slug, path, order and FriendlyUrl.

**Alternatives considered**: Persist breadcrumb separately; rejected because it can be derived from existing path/hierarchy.

## Risks

- A move to descendant can create infinite recursion if not blocked.
- Updating parent before validating all descendant paths can leave partial state.
- FriendlyUrl collisions can appear only after descendant path recalculation.
- Existing tests may cover one level but not deep descendants.

## Implementation Guidance

- Validate all proposed paths before mutating records when possible.
- Keep transaction boundaries in the service if multiple sections/FriendlyUrls change together.
- Do not alter public menu behavior in this feature.
