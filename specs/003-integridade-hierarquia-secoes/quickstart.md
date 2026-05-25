# Quickstart: Integridade de hierarquia e caminhos de secoes

**Status**: Planning only. Do not implement from this quickstart without generated tasks and explicit human authorization.

## Branch

Expected branch:

```powershell
git status --short --branch -uall
```

```text
feature/section-hierarchy-path-integrity
```

## Targeted Validation Commands

Use targeted checks first:

```powershell
npm run test:api -- apps/api/src/modules/sections/sections.service.test.ts
```

```powershell
npm run typecheck -w @abbatech/api
```

If the implementation touches shared contracts or broader behavior:

```powershell
npm run typecheck
```

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
