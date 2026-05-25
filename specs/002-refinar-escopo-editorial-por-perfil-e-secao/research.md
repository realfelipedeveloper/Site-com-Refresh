# Research: Refinar escopo editorial por perfil e secao

**Feature**: `002-refinar-escopo-editorial-por-perfil-e-secao`  
**Branch**: `feature/refine-editorial-scope-by-section`  
**Date**: 2026-05-25  
**Status**: Research completed; implementation followed the decisions recorded here.

## Scope

This research isolates the next small slice after the completed ICHC portability first slice. It covers only editorial section scope by active profile. It does not reopen the whole backlog from spec 001.

## Legacy Behavior Evidence

Legacy files inspected read-only:

- `legado/spec-kit-business-rules-gpt55.md`
- `legado/Manager/Secao.php`
- `legado/Manager/Conteudo.php`
- `legado/Manager/ado.php`
- `legado/Manager/website.sql`

Extracted business behavior:

- Sections are hierarchical and ordered; the legacy stores hierarchy through section ancestry data and orders siblings by section order.
- Public section behavior is separate from editorial scope. Legacy section controls include visible/hidden public menu behavior and public restricted behavior.
- Editorial publish scope is represented through profile-section associations.
- A section has a principal/responsible publisher profile and can have additional profiles allowed to publish in that section.
- Restricted public access uses a separate profile-section access relation. It must not be treated as editorial publish permission.
- Author/editor workflow used profile hierarchy to find an eligible publisher profile, then checked that publisher profile against section associations.
- In the content form, sections outside the allowed publish scope were disabled rather than treated as generally editable.
- The legacy did not provide evidence that selecting a parent section automatically grants all descendant sections for editorial operations. Descendant behavior must therefore be conservative unless explicitly represented.

Important boundary: the legacy is a behavior source only. No PHP, SQL, HTML, CSS, assets, paths, credentials, or implementation details are to be copied.

## Refresh Current State

Relevant current Refresh entities:

- `Role`
- `Role.parentRoleId`
- `RoleSectionAccess`
- `RoleContentTypeAccess`
- `RolePermission`
- `Section`
- `Content`

Relevant current services:

- `apps/api/src/modules/contents/contents.service.ts`
- `apps/api/src/modules/management/management.service.ts`
- `apps/api/src/modules/management/management.bootstrap.ts`
- `apps/api/src/modules/management/management.validation.service.ts`

Before this feature, `ContentsService.getRoleScope()` used `RoleSectionAccess` and `RoleContentTypeAccess` but expanded section access by section path descendants. The approved implementation corrected that behavior to use explicit `RoleSectionAccess.sectionId` only, matching the conservative legacy behavior extracted above.

## Decisions

### R-001: Editorial Scope Source

**Decision**: Use the Refresh-native `RoleSectionAccess` as the source for editorial section scope.

**Rationale**: It maps to the legacy `perfil_secao` behavior without copying old storage or names.

**Consequences**: No new CMS-like permission table is planned for the first slice.

### R-002: Public Policy Is Separate

**Decision**: Do not use `Section.accessPolicy` as editorial permission.

**Rationale**: `Section.accessPolicy` represents public section visibility/access from the previous feature slice. Editorial operations must remain governed by profile/role scope and permissions.

**Consequences**: A public section can still be administratively out of scope for a user.

### R-003: Descendant Inheritance

**Decision**: Treat profile-section scope as explicit by default. A role assigned to a parent section must not automatically edit all descendants unless the implementation has a separately approved and tested rule for descendant expansion.

**Rationale**: Legacy evidence shows exact profile-section checks for publish eligibility. It also stores hierarchy for organization/menu, but that is not enough to grant broad editorial access.

**Consequences**: The previous descendant expansion in `getRoleScope()` was covered by regression tests and removed for this feature slice.

### R-004: Broad Administrative Role

**Decision**: Preserve explicit broad access only for roles already modeled as unrestricted administrative/developer roles, but test it as an exception.

**Rationale**: The system already has admin-like role behavior. Broad access should remain explicit, not inferred from empty scope.

**Consequences**: Empty `RoleSectionAccess` for a normal editorial role means no editorial section scope.

### R-005: No Schema Change In First Implementation

**Decision**: Plan the first implementation without Prisma schema changes or migrations.

**Rationale**: Required relationships already exist in Refresh.

**Consequences**: If implementation discovers missing data shape, stop and create a new plan decision before migration.

## Risks

- Existing descendant expansion may grant access wider than the legacy behavior.
- Empty scope can accidentally mean unrestricted access if optional filters are applied incorrectly.
- Public section policy can be confused with editorial scope.
- Multiple profiles require using the active session role, not every role the user owns.
- A role hierarchy rule copied too broadly could reintroduce workflow behavior outside this feature.

## Implementation Questions Resolved For This Slice

- `getRoleScope()` remained inside `ContentsService` to keep the diff small; extraction can be considered only if future features create real duplication.
- Tests now lock down explicit section scope, empty normal scope, broad admin/developer exception, no descendant inheritance, public-policy separation, and `contents.publish`.
- API filtering was sufficient for this slice; no management bootstrap change was needed.
