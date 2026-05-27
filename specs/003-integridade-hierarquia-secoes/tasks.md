# Tasks: Integridade de hierarquia e caminhos de secoes

**Input**: Design documents from `specs/003-integridade-hierarquia-secoes/`

**Status**: T001-T008 implemented and validated with explicit human authorization. Broader gates were also executed after T008, including security, API, typecheck, lint, portal, refresh, migrations, CI with E2E, and smoke. T009 onward remains pending.

**Current branch**: `feature/section-hierarchy-path-integrity`

## Guardrails

- Do not copy PHP, SQL, HTML, CSS, JavaScript, assets, credentials, SMTP settings, IPs, paths or old configuration from `legado/`.
- Do not alter Prisma schema, create migrations or create seeds unless explicitly re-planned and authorized.
- Do not alter Portal, Refresh frontend, Docker, Compose, env, local-prod or production.
- Do not run Git write actions, commit, push, merge or deploy without explicit human instruction.

## Phase 1: Setup and Review

- [x] T001 Review branch and working tree with `git status --short --branch -uall`
- [x] T002 Review `apps/api/src/modules/sections/sections.service.ts`
- [x] T003 Review `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T004 Review legacy behavior evidence in `legado/Manager/Secao.php` and `legado/Manager/website.sql`

## Phase 2: User Story 1 - Impedir hierarquia invalida

- [x] T005 [US1] Add tests rejecting self-parent update in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T006 [US1] Add tests rejecting move under direct child in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T007 [US1] Add tests rejecting move under deep descendant in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T008 [US1] Implement cycle validation before section update in `apps/api/src/modules/sections/sections.service.ts`

**Validation after T008**: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` passed with 11 files and 112 tests. `npm run typecheck -w @abbatech/api` passed. The SMTP offline log belongs to a controlled auth test and did not fail the suite.

**Broader validation after T008**:
- `npm run test:security` passed.
- `npm run test:api` passed with 11 files and 112 tests.
- `npm run typecheck` passed for API, Portal and Refresh.
- `npm run lint` passed.
- `npm run test:portal` passed with 1 file and 5 tests.
- `npm run test:refresh` passed with 7 files and 45 tests.
- `npm run test:migrations` passed; with `RUN_TEST_DATABASE=true`, the isolated test DB applied all 12 migrations successfully.
- `npm run test:ci` passed against the test stack with `RUN_E2E=true`; coverage passed with 19 files and 162 tests, integration passed with 3 files and 7 tests, regression passed with 1 file and 4 tests, build passed for API/Portal/Refresh, and E2E passed with 8 tests.
- `npm run test:smoke` passed against API, Refresh and Portal in the test stack.

**Test harness note**: direct `npm run test:all -- --skip-playwright-install` exposed Windows/test-stack harness issues unrelated to the section hierarchy rule: port conflicts when the dev stack occupied 3333/3100/3101, `spawn EINVAL` in the runner path, and non-idempotent host `seed:test` when the API test container had already seeded the DB. The equivalent full sequence was executed manually against the isolated test stack after correcting the E2E auth harness. Dev containers were restored after the test stack cleanup.

## Phase 3: User Story 2 - Propagar caminhos e FriendlyUrl

- [ ] T009 [US2] Add tests for rename updating descendant paths in `apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T010 [US2] Add tests for move updating descendant paths in `apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T011 [US2] Add tests for FriendlyUrl update for descendants in `apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T012 [US2] Add tests proving collision prevents partial persistence in `apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T013 [US2] Implement safe descendant path/FriendlyUrl rebuild in `apps/api/src/modules/sections/sections.service.ts`

## Phase 4: User Story 3 - Preservar listagem administrativa coerente

- [ ] T014 [US3] Add regression test for admin section listing paths after hierarchy change in `apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T015 [US3] Confirm no public menu/accessPolicy behavior changed in `apps/api/src/modules/sections/sections.service.test.ts`

## Final Phase: Validation and Documentation

- [ ] T016 Run `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`
- [ ] T017 Run `npm run typecheck -w @abbatech/api`
- [ ] T018 Update `specs/003-integridade-hierarquia-secoes/data-model.md` with implementation result
- [ ] T019 Update `specs/003-integridade-hierarquia-secoes/quickstart.md` with validation result

## Execution Order

1. T001-T004
2. T005-T008
3. T009-T013
4. T014-T015
5. T016-T019

## Out of Scope

- New schema/migration/seed.
- Public menu changes.
- Portal layout or route changes.
- Multi-section content.
- Workflow editorial.
