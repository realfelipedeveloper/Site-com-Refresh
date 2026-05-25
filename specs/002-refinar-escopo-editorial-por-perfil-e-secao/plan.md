# Implementation Plan: Refinar escopo editorial por perfil e secao

**Branch**: `feature/refine-editorial-scope-by-section` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-refinar-escopo-editorial-por-perfil-e-secao/spec.md`

## Planning Status

**Implemented and validated for the approved feature slice**.

Implementation proceeded after tasks and explicit human authorization. Git write actions, migrations, seeds, Docker/Compose changes, deploys, commits, pushes and merges remain unauthorized unless explicitly requested.

## Summary

Refine editorial section scope so users can list, create, update, publish, archive, or change validity only within sections allowed for their active profile. The section business rule must follow the legacy behavior in `legado/` as a behavior source, not as implementation source.

The critical planning correction is to separate three concerns:

- Public section policy: already handled by `Section.accessPolicy` from spec 001.
- Editorial section scope: this feature, mapped to Refresh-native `RoleSectionAccess`.
- Workflow hierarchy: future feature, not implemented here.

Legacy evidence indicates explicit profile-section associations for editorial publishing. Therefore parent-section access must not automatically grant all descendants unless explicitly represented, approved, and tested.

## Technical Context

**Language/Version**: TypeScript on Node.js >= 20.11.0.

**Primary Dependencies**: NestJS API in `apps/api`, Prisma Client, MySQL, class-validator, Vitest.

**Storage**: MySQL through Prisma schema in `apps/api/prisma/schema.prisma`.

**Testing**: Vitest through root scripts such as `npm run test:api`, `npm run test:security`, and `npm run typecheck -w @abbatech/api`.

**Target Platform**: Refresh API and admin workflow. Portal behavior is explicitly out of scope except for regression safety.

**Project Type**: Monorepo web application with API, Portal, Refresh admin, and shared contracts.

**Performance Goals**: Keep role scope filtering bounded to normal CMS usage and avoid broad unindexed scans beyond existing section/content queries.

**Constraints**:

- No code from `legado/` may be copied.
- No schema/migration is expected for the first implementation slice.
- Empty editorial section scope must deny normal editorial access, not grant it.
- Public `accessPolicy` must not grant administrative permission.
- `contents.publish` remains required for publication actions.

**Scale/Scope**: One focused feature slice for the former T033 only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Development | PASS | Spec, checklist and this plan exist before implementation. |
| GitFlow and Explicit Git Actions | PASS | Branch is `feature/refine-editorial-scope-by-section`; no commit/push/merge authorized here. |
| Docker Environments | PASS | No Docker/local-prod/production changes planned. |
| Routes, Subpaths and Contracts | PASS | No Portal route change planned; API behavior remains backend-owned. |
| Prisma/MySQL/Migrations | PASS | Existing `RoleSectionAccess` is sufficient for the planned first slice; no migration planned. |
| Security/Auth/Data | PASS | Backend authorization is the core of this feature; no frontend-only guard. |
| Tests By Risk | PASS | Security and API tests are required before marking implementation complete. |
| Documentation Auditability | PASS | Legacy behavior is recorded in research without copying implementation. |
| Secrets and Local Files | PASS | No secrets, dumps, backups, `.env` files, or legacy assets are introduced. |

## Project Structure

### Documentation

```text
specs/002-refinar-escopo-editorial-por-perfil-e-secao/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contracts.md
└── checklists/
    └── requirements.md
```

### Source Areas Affected

```text
apps/api/
├── prisma/
│   └── schema.prisma              # unchanged; no migration was needed
└── src/modules/
    ├── contents/
    │   ├── contents.service.ts     # editorial scope policy/filter changes
    │   ├── contents.service.test.ts
    │   └── contents.controller.ts  # unchanged
    ├── management/
    │   ├── management.service.ts   # role section access already modeled
    │   ├── management.bootstrap.ts # may expose scope data to admin UI
    │   └── management.dto.ts
    └── auth/
        └── auth.types.ts           # active role context

packages/contracts/
└── src/
    └── contents.ts                 # unchanged
```

**Structure Decision**: API/backend-first implementation. No Portal or layout changes were made.

## Legacy Business Rule Mapping

| Legacy behavior | Refresh-native mapping | First-slice decision |
|-----------------|------------------------|----------------------|
| Perfil ativo define funcao/permissao editorial | `AuthenticatedUser.roleId` and `Role` | Use active role only. |
| Perfil-secao define onde pode publicar | `RoleSectionAccess` | Use as editorial section scope. |
| Perfil superior orienta autor/editor/workflow | `Role.parentRoleId` | Recognize as legacy behavior but defer workflow routing. |
| Secao possui grupo publicador principal | Role/section association and future workflow owner | Do not add a new owner field now. |
| Secao oculta/restrita controla portal | `Section.accessPolicy`, `visibleInMenu`, `isActive` | Already handled by spec 001; keep separate. |
| Secao pai organiza hierarquia | `Section.parentId` and `Section.path` | Use for display/filter support, not automatic editorial grant by default. |

## Data Model Impact

No Prisma schema change is planned for the first implementation slice.

Existing entities already cover the needed model:

- `Role`
- `Role.parentRoleId`
- `RoleSectionAccess`
- `RoleContentTypeAccess`
- `RolePermission`
- `Section`
- `Content`

Implementation correction completed:

- `ContentsService.getRoleScope()` now uses explicit `RoleSectionAccess.sectionId` and no longer expands section access to descendants via section path.
- `listAdmin()` treats empty normal-role section/content-type scope as an empty result filter rather than unrestricted access.
- Existing-content section scope is checked before update side effects.

## API Impact

Implemented behavior:

- `GET /contents/admin/list`: should return only content in active-role editorial scope, except explicit broad roles.
- `GET /contents/meta`: should return only sections/content types allowed for the active role.
- `POST /contents/admin`: should reject creation outside active-role section scope.
- `PATCH /contents/admin/:id`: should reject updating content outside current or target section scope.
- Publication actions remain gated by `contents.publish` in addition to section scope.

Expected error behavior:

- Out-of-scope operations should return a safe authorization failure, preferably 403.
- Error responses must not disclose restricted content/section details beyond the minimal denial message.

## Frontend/Admin Impact

Refresh admin may receive narrower API data for content lists and editor metadata. No layout work is planned. Portal remains unchanged except regression validation.

## Testing Strategy

Unit/API tests:

- Allowed section create/update succeeds when other permissions are valid.
- Out-of-scope create rejects before persistence.
- Out-of-scope update rejects before persistence.
- Moving content to an out-of-scope section rejects before persistence.
- Admin list excludes out-of-scope content for normal roles.
- Empty section scope denies normal editorial roles.
- Explicit broad admin role remains broad by tested exception.
- `contents.publish` is still required for publication even inside section scope.

Regression tests:

- Public content policy remains unchanged.
- Public menu behavior remains unchanged.
- FriendlyUrl behavior remains unchanged.

Security tests:

- No section scope leak via admin list.
- No partial persistence after Forbidden errors.
- No frontend-only authorization.

Validation commands executed for implementation:

- `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts`
- `npm run typecheck -w @abbatech/api`
- `npm run test:security`

## Environment Validation

Dev:

- Run targeted API tests and API typecheck.
- No migration expected.
- If a migration becomes necessary, stop and re-plan before running any migration command.

Local-prod:

- No local-prod action for this planning slice.

Production:

- No production action for this planning slice.

## Documentation Plan

This plan creates:

- `research.md`
- `data-model.md`
- `contracts/api-contracts.md`
- `quickstart.md`

The generated tasks stayed limited to this focused slice and did not reopen the previous backlog.

## Risk and Rollback

Primary risks:

- Over-permissive descendant expansion from parent sections.
- Empty scope accidentally interpreted as unrestricted.
- Mixing public `accessPolicy` with editorial permission.
- Active role ignored when a user has multiple roles.
- Workflow hierarchy implemented prematurely.

Rollback strategy:

- Keep changes isolated to backend policy/tests.
- Avoid schema/migration in first implementation.
- If behavior is too restrictive, revert only the policy change and tests before broad rollout.

## Implementation Recommendation

Recommended next step: human review of the final diff, then explicit Git actions only if approved.

Implemented slice:

1. Added tests for explicit section scope by active role.
2. Added tests proving parent section does not automatically grant descendants.
3. Adjusted `getRoleScope()` to use explicit `RoleSectionAccess` only.
4. Validated admin list, editor meta, create, update, public policy regression, and publish-permission interactions.

Status:

- **Implemented** after explicit authorization.
- **No commit/push/merge/deploy performed**.

## Complexity Tracking

No constitution violations are expected.
