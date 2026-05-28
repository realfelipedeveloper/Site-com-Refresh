# Quickstart: Integridade de hierarquia e caminhos de secoes

**Status**: Implemented through T001-T019 with targeted validation. Full branch validation gate T020-T030 was executed before commit/PR. Direct `test:all` remains blocked by the known Windows harness `spawn EINVAL`, so the equivalent isolated manual sequence was executed and passed.

## Branch

Expected branch:

```powershell
git status --short --branch -uall
```

```text
feature/section-path-friendlyurl-propagation
```

## Targeted Validation Commands

Targeted checks already executed for this subfatia:

```powershell
npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts
```

Result: passed with 11 files and 118 tests.

```powershell
npm run typecheck -w @abbatech/api
```

Result: passed.

## Mandatory Full Validation Gate

Run these commands before any commit/PR for every branch. Do not close a branch based only on targeted tests.

```powershell
npm run test:security
```

```powershell
npm run test:api
```

```powershell
npm run typecheck
```

```powershell
npm run lint
```

```powershell
npm run test:portal
```

```powershell
npm run test:refresh
```

```powershell
npm run test:migrations
```

```powershell
npm run test:ci
```

If the test stack is running, also run:

```powershell
npm run test:smoke
```

Attempt the full automation command as the last gate:

```powershell
npm run test:all -- --skip-playwright-install
```

If `test:all` is blocked by the known Windows/test-stack harness issues, document the exact blocker and execute the equivalent manual sequence against the isolated test stack. A human waiver is required to close the branch with `test:all` blocked.

Results for this branch:

- `npm run test:security`: passed with 2 files and 6 tests.
- `npm run test:api`: passed with 11 files and 118 tests. The SMTP offline log belongs to a controlled auth test and did not fail the suite.
- `npm run typecheck`: passed for API, Portal and Refresh.
- `npm run lint`: passed.
- `npm run test:portal`: passed with 1 file and 5 tests.
- `npm run test:refresh`: passed with 7 files and 45 tests.
- `npm run test:migrations`: passed in host mode with schema validation; deploy was skipped because `RUN_TEST_DATABASE=true` was not set.
- Isolated migration validation with `.env.test` and `RUN_TEST_DATABASE=true`: passed against MySQL `refresh_test` on `localhost:3308` with 12 migrations and no pending migrations.
- `npm run seed:test`: passed against the isolated test stack.
- `npm run test:ci`: passed in host mode with E2E skipped because `RUN_E2E=true` was not set.
- Isolated `npm run test:ci` with `.env.test`, `RUN_TEST_DATABASE=true` and `RUN_E2E=true`: passed after an initial transient desktop Chromium E2E timeout was retried successfully. The passing run included lint, typecheck, coverage, integration, regression, migration deploy validation, build and E2E 8/8.
- `npm run test:smoke` with `RUN_SMOKE=true`: passed against API, Refresh and Portal; also passed against the isolated test stack.
- Direct `npm run test:all -- --skip-playwright-install`: attempted twice. The first attempt was blocked by dev-stack port collision on 3333/3100/3101. After stopping dev containers without volumes, the second attempt started the test stack and reached health checks, then failed with the known Windows harness error `spawn EINVAL` while spawning `npm run test:migrations`.
- Equivalent manual `test:all` sequence: passed by starting the isolated test stack, running migration deploy validation, `seed:test`, `test:ci` with E2E enabled, `test:smoke`, cleaning the test stack and restoring the dev stack.

## Prohibitions

- Do not copy PHP, SQL, HTML, CSS, JavaScript, assets, credentials, SMTP settings, IPs, paths or old configuration from `legado/`.
- Do not create schema, migration or seed unless a new explicit human decision approves it.
- Do not alter Docker, Compose, env, local-prod or production.
- Do not run `prisma db push`, `prisma migrate reset` or manual SQL.
- Do not commit, push, merge or deploy without explicit human instruction.

## Expected Implementation Shape

- Tests first in `apps/api/src/modules/sections/sections.service.test.ts`.
- Minimal backend change in `apps/api/src/modules/sections/sections.service.ts`.
- Documentation update in this spec after validation.

## Implementation Result

- Section self-parent and descendant-parent moves are rejected.
- Renaming or moving a section recalculates descendant `Section.path` values.
- Affected section `FriendlyUrl.path` values are synchronized in the same transaction.
- Generated `Section.path` and `FriendlyUrl.path` collisions fail before partial persistence.
- Admin section listings continue returning coherent hierarchical paths.
- Public menu/accessPolicy behavior was regression-tested and not changed by this feature.
