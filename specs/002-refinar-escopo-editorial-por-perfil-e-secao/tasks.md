# Tasks: Refinar escopo editorial por perfil e secao

**Input**: Design documents from `specs/002-refinar-escopo-editorial-por-perfil-e-secao/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-contracts.md](./contracts/api-contracts.md), [quickstart.md](./quickstart.md)

**Status**: US1, US2 and US3 implemented with explicit human authorization. Final documentation notes completed.

**Current branch**: `feature/refine-editorial-scope-by-section`. This is the branch used for this spec. Older Spec Kit helpers may still expect numeric branch names such as `001-*`, but that warning does not replace this branch decision.

**Tests**: Required. This feature exists to close an authorization risk, so tests must be written before or alongside implementation.

**Organization**: Tasks are grouped by user story and intentionally small. This spec must not reopen the full backlog from spec 001.

**Current status**: Feature slice completed. T001-T032 were executed. T028-T030 were rerun after US3, and T031-T032 recorded the no-schema/no-migration result plus validation notes.

## Guardrails

- Do not copy PHP, SQL, HTML, CSS, JavaScript, assets, credentials, SMTP settings, IPs, paths, or old configuration from `legado/`.
- Do not alter Prisma schema or create migrations unless a new human-approved plan decision explicitly authorizes it.
- Do not create seeds, Docker/Compose changes, workflow changes, local-prod changes, production changes, commits, pushes, merges, or deploys without explicit human instruction.
- Do not implement workflow editorial, multi-section content, public search, newsletter, ouvidoria, attachments, galleries, catalog-wide legacy content types, or public route changes in this feature.
- Treat `Section.accessPolicy` as public behavior only. It must not grant editorial/admin permission.
- Treat `RoleSectionAccess` as the Refresh-native source for legacy profile-section editorial scope.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files or is read-only.
- **[Story]**: Maps to user stories in [spec.md](./spec.md).

---

## Phase 1: Setup and Governance

**Purpose**: Confirm this is a focused feature slice and prevent the planning drift that affected spec 001.

- [x] T001 Review branch, working tree, and feature pointer using `git status --short --branch -uall` and `.specify/feature.json`
- [x] T002 [P] Review legacy business evidence recorded in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/research.md`
- [x] T003 [P] Review current data model assumptions in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/data-model.md`
- [x] T004 [P] Review planned API behavior in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/contracts/api-contracts.md`

**Checkpoint**: Proceed only if the scope is still limited to editorial section scope by active profile.

---

## Phase 2: Foundational Review

**Purpose**: Confirm the existing implementation points before changing runtime.

- [x] T005 Inspect current role/section scope behavior in `apps/api/src/modules/contents/contents.service.ts`
- [x] T006 [P] Inspect role section access creation/update behavior in `apps/api/src/modules/management/management.service.ts`
- [x] T007 [P] Inspect role DTO and bootstrap exposure for section scope in `apps/api/src/modules/management/management.dto.ts`
- [x] T008 [P] Inspect existing content tests and fixtures in `apps/api/src/modules/contents/contents.service.test.ts`

**Checkpoint**: No schema or migration should be needed. If schema/migration appears necessary, stop and re-plan.

---

## Phase 3: User Story 1 - Bloquear operacoes editoriais fora do escopo (Priority: P1) MVP

**Goal**: Prevent users from creating, updating, publishing, archiving, or changing validity for content outside the active role's editorial section scope.

**Independent Test**: A user scoped to section A succeeds in section A and receives 403 without persistence when attempting section B.

### Tests for User Story 1

- [x] T009 [US1] Add tests for create allowed in an explicitly scoped section in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T010 [US1] Add tests for create rejected outside explicit section scope with no content, SEO, revision, FriendlyUrl, or audit persistence in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T011 [US1] Add tests for update rejected when existing content is outside active role scope in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T012 [US1] Add tests for moving content from an allowed section to an out-of-scope section in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T013 [US1] Add tests proving parent section access does not automatically grant descendant section access in `apps/api/src/modules/contents/contents.service.test.ts`

### Implementation for User Story 1

- [x] T014 [US1] Adjust editorial scope calculation to use explicit `RoleSectionAccess` without automatic descendant expansion in `apps/api/src/modules/contents/contents.service.ts`
- [x] T015 [US1] Enforce current-content section scope before update side effects in `apps/api/src/modules/contents/contents.service.ts`
- [x] T016 [US1] Enforce target-section scope before create/update side effects in `apps/api/src/modules/contents/contents.service.ts`
- [x] T017 [US1] Preserve `contents.publish` checks in addition to section scope in `apps/api/src/modules/contents/contents.service.ts`

**Checkpoint**: US1 is complete only when scoped allow/deny tests pass and no partial persistence occurs.

---

## Phase 4: User Story 2 - Listar conteudos administrativos por escopo editorial (Priority: P2)

**Goal**: Admin content listing and editor metadata expose only the active role's editorial scope, except explicit broad admin roles.

**Independent Test**: A scoped user only sees allowed sections/content; a normal user with empty section scope sees none; a tested broad role sees all.

### Tests for User Story 2

- [x] T018 [US2] Add admin list tests for allowed sections, disallowed sections, empty normal scope, and broad admin exception in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T019 [US2] Add editor meta tests for allowed sections, empty normal scope, and broad admin exception in `apps/api/src/modules/contents/contents.service.test.ts`

### Implementation for User Story 2

- [x] T020 [US2] Apply explicit empty-scope handling to `listAdmin()` so empty normal scope returns no content in `apps/api/src/modules/contents/contents.service.ts`
- [x] T021 [US2] Apply explicit empty-scope handling to `getEditorMeta()` so empty normal scope returns no sections in `apps/api/src/modules/contents/contents.service.ts`
- [x] T022 [US2] Keep broad admin/developer access explicit and covered by tests in `apps/api/src/modules/contents/contents.service.ts`

**Checkpoint**: US2 is complete only when admin list and editor meta cannot leak out-of-scope sections/content.

---

## Phase 5: User Story 3 - Preservar separacao entre acesso publico e escopo editorial (Priority: P2)

**Goal**: Preserve the public policy from spec 001 and make sure public section visibility never grants editorial/admin permission.

**Independent Test**: Public content/menu tests remain valid, while a public section without `RoleSectionAccess` still denies admin edits.

### Tests for User Story 3

- [x] T023 [US3] Add regression test that `Section.accessPolicy = "public"` does not grant editorial write access without `RoleSectionAccess` in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T024 [US3] Add regression test that public content policy remains unchanged for published public content in public sections in `apps/api/src/modules/contents/contents.service.test.ts`
- [x] T025 [US3] Add regression test that `contents.publish` remains required even when the section is in scope in `apps/api/src/modules/contents/contents.service.test.ts`

### Implementation for User Story 3

- [x] T026 [US3] Confirm implementation uses `RoleSectionAccess` rather than `Section.accessPolicy` for admin scope in `apps/api/src/modules/contents/contents.service.ts`
- [x] T027 [US3] Update contract documentation for admin scope behavior in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/contracts/api-contracts.md`

**Checkpoint**: US3 is complete only when public behavior is unchanged and admin scope remains backend-owned.

---

## Final Phase: Validation and Documentation

**Purpose**: Close the slice with targeted validation and current documentation.

- [x] T028 Run targeted contents tests with `npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts` and record result in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/tasks.md` - US3 run passed: 11 files, 109 tests. SMTP offline log belongs to controlled auth test.
- [x] T029 Run API typecheck with `npm run typecheck -w @abbatech/api` and record result in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/tasks.md` - passed after US3.
- [x] T030 Run security tests with `npm run test:security` and record result in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/tasks.md` - passed after US3: 2 files, 6 tests.
- [x] T031 [P] Update data-model notes if implementation confirms no schema/migration was needed in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/data-model.md`
- [x] T032 [P] Update quickstart validation notes after implementation in `specs/002-refinar-escopo-editorial-por-perfil-e-secao/quickstart.md`

---

## Dependencies and Execution Order

### Phase Dependencies

- Phase 1 must complete before any implementation work.
- Phase 2 must complete before user-story tests or runtime changes.
- US1 is the MVP and must complete before US2/US3 implementation changes.
- US2 and US3 may be planned independently after US1 tests exist, but implementation should stay sequential to keep the diff small.
- Final validation depends on all selected user stories being complete.

### Completed Execution Order

1. T001-T004
2. T005-T008
3. T009-T013
4. T014-T017
5. T018-T022
6. T028-T030 for US1/US2 validation
7. T023-T027
8. T028-T032 final validation and documentation closure

### Parallel Opportunities

- T002-T004 are read-only and can be reviewed independently.
- T006-T008 are read-only and can be reviewed independently.
- T031-T032 can run in parallel after implementation validation.

No test-writing tasks in `contents.service.test.ts` are marked parallel because they touch the same file.

---

## Implementation Strategy

### MVP First

Implement only US1 first:

1. Add tests T009-T013.
2. Implement T014-T017.
3. Run T028 and T029 at minimum.
4. Stop for review before US2/US3 if anything unexpected appears.

### Incremental Delivery

1. US1 closes mutation risk.
2. US2 closes admin listing/meta exposure risk.
3. US3 closes regression risk between public policy and editorial scope.

### Stop Conditions

Stop and report before proceeding if:

- A Prisma schema or migration change appears necessary.
- Any implementation would touch Portal layout or public routes.
- Any task would require copying from `legado/`.
- A normal role with empty scope would remain unrestricted.
- A parent section would grant descendants without explicit approval and tests.

---

## Out of Scope

- Workflow editorial routing by profile hierarchy.
- Multi-section content.
- Newsletter.
- Ouvidoria.
- Tags, attachments, galleries.
- Public search.
- Legacy content type catalog.
- Public menu changes.
- Portal layout changes.
- New migrations or seeds.
