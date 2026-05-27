# Data Model: Integridade de hierarquia e caminhos de secoes

**Status**: Planned; no schema change expected.

## Existing Entities

### Section

Relevant fields:

- `id`
- `parentId`
- `name`
- `slug`
- `path`
- `order`
- `isActive`
- `visibleInMenu`
- `accessPolicy`

Rules:

- `parentId` defines the tree.
- `slug` defines the local path segment.
- `path` is the normalized canonical hierarchical path.
- `order` controls sibling ordering.
- A section cannot be its own parent.
- A section cannot be moved below any of its descendants.
- Descendant paths must be recalculated when an ancestor path changes.

### FriendlyUrl

Relevant fields:

- `path`
- `targetType`
- `sectionId`
- `isActive`

Rules:

- Section `FriendlyUrl.path` must match the current `Section.path`.
- Path uniqueness remains global across sections and content.
- A collision with another target blocks the operation.

## Migration Impact

No migration is planned. If implementation discovers a missing capability, stop and re-plan before schema work.

## Legacy Mapping

| Legacy concept | Refresh-native mapping | Notes |
|----------------|------------------------|-------|
| `secao_dna` | `Section.parentId` and ancestry traversal | Do not copy storage format. |
| `secao_nome_ordem` | `Section.path` and admin display ordering | Breadcrumb can be derived. |
| `secao_ordem` | `Section.order` | Preserve sibling ordering. |
| `secao_url_amigavel` / `url_amigavel` | `FriendlyUrl.path` | Use global URL source from spec 001. |

## Integrity Rules

- Validate cycles before update.
- Validate all new descendant paths before mutating when feasible.
- Do not leave section paths and FriendlyUrl paths divergent.
- Do not alter `Section.accessPolicy` semantics.
