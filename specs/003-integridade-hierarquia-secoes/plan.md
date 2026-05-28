# Implementation Plan: Integridade de hierarquia e caminhos de secoes

**Branch atual**: `feature/section-path-friendlyurl-propagation` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Branch inicial da spec**: `feature/section-hierarchy-path-integrity`, usada para concluir US1/T001-T008.

## Planning Status

**Implementation in progress on the authorized feature branch.**

T001-T019 are implemented with targeted validations. The branch is not ready for commit/PR until the mandatory full validation gate in `tasks.md` and `quickstart.md` is executed and documented. Git write actions, migrations, seeds, Docker/Compose changes, deploys, commits, pushes and merges remain unauthorized unless explicitly requested.

## Summary

This feature preserves section hierarchy integrity when sections are renamed or moved. It maps legacy `secao_dna` and `secao_nome_ordem` behavior to Refresh-native `Section.parentId`, `Section.path`, `Section.order` and `FriendlyUrl`, without copying legacy implementation.

## Technical Context

- Monorepo TypeScript/NestJS API.
- Prisma/MySQL data model already contains `Section` and `FriendlyUrl`.
- Tests use Vitest through root npm scripts.
- No schema or migration expected.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Spec-Driven Development | PASS | Spec/checklist/plan created before implementation. |
| GitFlow and Explicit Git Actions | PASS | Branch is `feature/section-hierarchy-path-integrity`; no commit/push/merge authorized. |
| Docker Environments | PASS | No Docker/local-prod/production change planned. |
| Routes/Subpaths/Contracts | PASS | No Portal route or public route change planned. |
| Prisma/MySQL/Migrations | PASS | Existing schema expected sufficient; no migration planned. |
| Security/Auth/Data | PASS | Backend validates hierarchy integrity. |
| Tests By Risk | PASS | Cycle/path/FriendlyUrl tests required. |
| Documentation Auditability | PASS | Legacy evidence recorded without copying implementation. |
| Secrets/Local Files | PASS | No secrets or legacy artifacts introduced. |

## Project Structure

Likely affected:

```text
apps/api/src/modules/sections/sections.service.ts
apps/api/src/modules/sections/sections.service.test.ts
specs/003-integridade-hierarquia-secoes/
```

Read-only references:

```text
apps/api/prisma/schema.prisma
packages/contracts/src/sections.ts
legado/Manager/Secao.php
legado/Manager/website.sql
```

## Data Model Impact

No schema change planned.

Existing entities:

- `Section`
- `FriendlyUrl`

## API Impact

- `PATCH /sections/admin/:id` should reject cycles and update descendant paths/FriendlyUrls safely.
- `GET /sections/admin` should continue returning coherent paths.

## Testing Strategy

Required targeted tests:

- Reject self-parent.
- Reject parent set to direct child.
- Reject parent set to deep descendant.
- Rename section updates descendant paths.
- Move section updates descendant paths.
- FriendlyUrl records update for moved/renamed section and descendants.
- Collision in any affected path prevents partial persistence.

Targeted validation while developing:

- `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`
- `npm run typecheck -w @abbatech/api`

Mandatory full validation before commit/PR:

- `npm run test:security`
- `npm run test:api`
- `npm run typecheck`
- `npm run lint`
- `npm run test:portal`
- `npm run test:refresh`
- `npm run test:migrations`
- `npm run test:ci`
- `npm run test:smoke` when a test stack is running
- `npm run test:all -- --skip-playwright-install`, or an explicitly documented equivalent manual full-stack sequence if the Windows/test-stack harness blocks the command

## Risk and Rollback

Risks:

- Cycle causing infinite recursion.
- Partial path/FriendlyUrl update on collision.
- Accidentally changing menu/public access behavior.

Rollback:

- Revert service/test changes only.
- No migration rollback should be needed.

## Implementation Recommendation

Generate tasks, then implement tests before runtime. Keep the first implementation slice limited to `SectionsService` and its tests.
