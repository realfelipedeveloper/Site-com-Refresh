# Data Model: Refinar escopo editorial por perfil e secao

**Status**: Implemented for this feature slice; no schema change, migration or seed was needed.

## Existing Refresh Entities

### Role

Represents the active editorial/admin profile.

Relevant fields:

- `id`
- `name`
- `functionName`
- `status`
- `parentRoleId`

Rules:

- The active session role is the source for editorial scope.
- Broad administrative access must be explicit and tested.
- Role hierarchy is recognized as legacy behavior for workflow/routing, but full workflow is out of scope for this feature.

### Section

Represents the CMS section hierarchy.

Relevant fields:

- `id`
- `parentId`
- `name`
- `slug`
- `path`
- `order`
- `visibleInMenu`
- `isActive`
- `accessPolicy`

Rules:

- `accessPolicy` is public behavior, not editorial permission.
- Section hierarchy may help find/compare sections, but does not automatically grant editorial access in this feature.
- Inactive sections cannot be selected for new editorial operations.

### RoleSectionAccess

Represents editorial section scope.

Fields:

- `roleId`
- `sectionId`

Rules:

- This is the native Refresh mapping for legacy profile-section publish scope.
- A normal role with no entries has no editorial section scope.
- A section is in scope only when explicitly covered by this relation or by an explicitly approved broad role exception.
- Descendant sections are not granted merely because a parent is granted, unless tasks later encode an approved explicit rule.

### RoleContentTypeAccess

Represents allowed content type/mask scope.

Rules:

- Existing behavior should be preserved.
- This feature focuses on section scope and must not reproduce the legacy mask catalog.

### Content

Represents editorial content.

Relevant fields:

- `id`
- `status`
- `sectionId`
- `contentTypeId`
- `validFrom`
- `validUntil`
- `validateValidity`

Rules:

- Admin listing and mutations must respect active-role section scope.
- Publication still requires `contents.publish`.
- Public behavior from spec 001 must remain unchanged.

## Migration Impact

No migration was created for this feature slice because `RoleSectionAccess` already existed and was sufficient for the approved business rule.

If implementation discovers a missing model capability, stop and create a new plan decision before schema or migration work.

## Legacy Mapping

| Legacy concept | Refresh entity | Notes |
|----------------|----------------|-------|
| `perfil` | `Role` | Native naming retained. |
| `perfil.Superior_id` | `Role.parentRoleId` | Workflow-oriented; not full implementation here. |
| `perfil_secao` | `RoleSectionAccess` | Editorial publish/scope relation. |
| `perfil_secao_acesso` | Future public restricted access mapping | Not editorial permission. |
| `secao` | `Section` | Hierarchy/order retained natively. |
| `secao_controle` | `Section.accessPolicy` | Public access policy from spec 001. |
| `SECAO_APARECE_SITE` | `visibleInMenu` | Public menu visibility. |

## Data Integrity Rules

- Denied operations must not persist partial data.
- Empty scope must be handled explicitly.
- Active role must be used consistently across list, meta, create and update operations.
- Errors must not expose out-of-scope content bodies or private section details.

## Implementation Result

- US1 now blocks create/update/move operations outside the active role's explicit `RoleSectionAccess` scope.
- US2 now filters admin content listing and editor metadata by explicit active-role section and content-type scope, with broad admin/developer access kept as a tested exception.
- US3 confirms `Section.accessPolicy` does not grant editorial/admin access and `contents.publish` remains required for publication actions.
- Parent section access still does not grant descendant sections automatically.
- No Prisma schema, migration, seed, Docker, Compose, local-prod or production change was introduced.
