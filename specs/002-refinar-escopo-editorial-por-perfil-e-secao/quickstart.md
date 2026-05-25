# Quickstart: Refinar escopo editorial por perfil e secao

**Status**: Feature slice implemented and validated. Future changes still require generated tasks and explicit human authorization.

## Pre-Implementation Checks

1. Confirm branch:

```powershell
git status --short --branch -uall
```

Expected branch:

```text
feature/refine-editorial-scope-by-section
```

This is the branch used for this spec. If an older Spec Kit helper complains about numeric branch naming, keep this branch and do not rename or switch branches automatically.

2. Confirm no unrelated working tree changes in files that tasks will touch.

3. Confirm the implementation task is limited to editorial section scope and does not reopen the spec 001 backlog.

## Validation Commands Used

Targeted checks used for this slice:

```powershell
npm run test:api -- apps/api/src/modules/contents/contents.service.test.ts
```

Result after US3: passed, 11 files and 109 tests. The SMTP offline log belongs to a controlled auth test and did not fail the suite.

```powershell
npm run typecheck -w @abbatech/api
```

Result after US3: passed.

```powershell
npm run test:security
```

Result after US3: passed, 2 files and 6 tests.

Optional broader regression after the targeted checks pass:

```powershell
npm run test:api
```

```powershell
npm run typecheck
```

## Explicit Prohibitions For This Feature Slice

- Do not copy code, SQL, PHP, HTML, CSS, JavaScript, assets, paths, credentials, SMTP config, IPs, or old configuration from `legado/`.
- Do not alter Prisma schema unless a new plan decision explicitly authorizes it.
- Do not create migrations, seeds, Docker, Compose, workflow, local-prod, or production changes in the first implementation slice.
- Do not run `prisma db push`, `prisma migrate reset`, or manual SQL.
- Do not commit, push, merge, or deploy without explicit human instruction.

## Legacy Behavior To Preserve

- Editorial section permission follows profile-section association behavior.
- Public section access and editorial section scope are separate.
- Parent/child hierarchy organizes sections but does not grant broad editorial access by itself.
- Empty editorial scope denies normal editor access.
