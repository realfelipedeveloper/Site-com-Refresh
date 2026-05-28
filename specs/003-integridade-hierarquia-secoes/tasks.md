# Tasks: Integridade de hierarquia e caminhos de secoes

**Input**: Design documents from `specs/003-integridade-hierarquia-secoes/`

**Status**: T001-T030 implemented/executed with explicit human authorization. Targeted validations passed after T013/T015, and the mandatory full branch validation gate was executed before commit/PR. The direct `test:all` harness remains blocked on Windows by `spawn EINVAL`, so the documented equivalent isolated sequence was executed and passed.

**Current branch**: `feature/section-path-friendlyurl-propagation`

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

- [x] T009 [US2] Add tests for rename updating descendant paths in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T010 [US2] Add tests for move updating descendant paths in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T011 [US2] Add tests for FriendlyUrl update for descendants in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T012 [US2] Add tests proving collision prevents partial persistence in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T013 [US2] Implement safe descendant path/FriendlyUrl rebuild in `apps/api/src/modules/sections/sections.service.ts`

**Validation after T013**: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` passed with 11 files and 116 tests. `npm run typecheck -w @abbatech/api` passed. The SMTP offline log belongs to a controlled auth test and did not fail the suite.

## Phase 4: User Story 3 - Preservar listagem administrativa coerente

- [x] T014 [US3] Add regression test for admin section listing paths after hierarchy change in `apps/api/src/modules/sections/sections.service.test.ts`
- [x] T015 [US3] Confirm no public menu/accessPolicy behavior changed in `apps/api/src/modules/sections/sections.service.test.ts`

**Validation after T015**: `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts` passed with 11 files and 118 tests. `npm run typecheck -w @abbatech/api` passed. The SMTP offline log belongs to a controlled auth test and did not fail the suite.

## Final Phase: Validation and Documentation

- [x] T016 Run `npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts`
- [x] T017 Run `npm run typecheck -w @abbatech/api`
- [x] T018 Update `specs/003-integridade-hierarquia-secoes/data-model.md` with implementation result
- [x] T019 Update `specs/003-integridade-hierarquia-secoes/quickstart.md` with validation result

## Mandatory Full Validation Gate Before Commit/PR

These checks must be executed for every implementation branch after the targeted tests pass. A branch must not be considered ready for commit/PR until every applicable gate passes or a blocker/waiver is explicitly documented by a human.

- [x] T020 Run `npm run test:security`
- [x] T021 Run `npm run test:api`
- [x] T022 Run `npm run typecheck`
- [x] T023 Run `npm run lint`
- [x] T024 Run `npm run test:portal`
- [x] T025 Run `npm run test:refresh`
- [x] T026 Run `npm run test:migrations`
- [x] T027 Run `npm run test:ci`
- [x] T028 Run `npm run test:smoke` when a test stack is running, or document why it cannot run.
- [x] T029 Attempt `npm run test:all -- --skip-playwright-install` or document the known Windows/test-stack harness blocker and execute the equivalent manual sequence.
- [x] T030 Update this file and `quickstart.md` with the exact full-gate results before requesting commit/PR.

**Validation policy**: targeted checks are acceptable while developing a small subfatia, but they are not sufficient to close a branch. Full validation is always required before commit/PR.

**Full validation results for this branch**:

- `npm run test:security` passed with 2 files and 6 tests.
- `npm run test:api` passed with 11 files and 118 tests. The SMTP offline log belongs to a controlled auth test and did not fail the suite.
- `npm run typecheck` passed for API, Portal and Refresh.
- `npm run lint` passed.
- `npm run test:portal` passed with 1 file and 5 tests.
- `npm run test:refresh` passed with 7 files and 45 tests.
- `npm run test:migrations` passed in host mode with schema validation; deploy was skipped because `RUN_TEST_DATABASE=true` was not set.
- Manual isolated migration validation against `.env.test` with `RUN_TEST_DATABASE=true` passed against MySQL `refresh_test` on `localhost:3308`; all 12 migrations were present and no pending migrations remained.
- `npm run seed:test` passed against the isolated test stack.
- `npm run test:ci` passed in host mode with E2E skipped because `RUN_E2E=true` was not set.
- Manual isolated `npm run test:ci` with `.env.test`, `RUN_TEST_DATABASE=true` and `RUN_E2E=true` passed after an initial transient desktop Chromium E2E timeout was retried successfully. The passing run included lint, typecheck, coverage (19 files, 168 tests), integration (3 files, 7 tests), regression (1 file, 4 tests), migration deploy validation against `refresh_test`, API/Portal/Refresh build and E2E (8 tests).
- `npm run test:smoke` first skipped by design without `RUN_SMOKE=true`; rerun with `RUN_SMOKE=true` passed against API, Refresh and Portal. The same smoke gate also passed against the isolated test stack.
- Direct `npm run test:all -- --skip-playwright-install` was attempted twice. First attempt was blocked by port collision while the dev stack occupied 3333/3100/3101. After stopping dev containers without volumes, the second attempt started the test stack and reached health checks but failed with the known Windows harness error `spawn EINVAL` while spawning `npm run test:migrations`.
- Because direct `test:all` was blocked by the Windows harness, the equivalent manual sequence was executed against the isolated test stack: start test stack, `test:migrations` with `RUN_TEST_DATABASE=true`, `seed:test`, `test:ci` with `RUN_E2E=true`, `test:smoke` with `RUN_SMOKE=true`, cleanup test stack, restore dev stack.

## Execution Order

1. T001-T004
2. T005-T008
3. T009-T013
4. T014-T015
5. T016-T019
6. T020-T030

## Out of Scope

- New schema/migration/seed.
- Public menu changes.
- Portal layout or route changes.
- Multi-section content.
- Workflow editorial.
