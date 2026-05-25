# API Contracts: Refinar escopo editorial por perfil e secao

**Status**: US1, US2 and US3 implemented.

## Contract Principle

Editorial section scope is enforced by the API. The Refresh admin may use returned metadata to guide the UI, but authorization must remain in backend services.

`RoleSectionAccess` is the source of editorial/admin section scope. `Section.accessPolicy` is public behavior only and does not grant admin listing, create, update, publish, archive or validity-change permission.

## Existing Endpoints Affected

### `GET /contents/admin/list`

Requires:

- authenticated user;
- `contents.read`.

Implemented behavior:

- Returns only content whose `sectionId` is inside the active role editorial scope.
- Explicit broad administrative roles may return all content, but only as a tested exception.
- Normal roles with empty section scope return no content.
- Public `Section.accessPolicy` does not grant admin visibility.

### `GET /contents/meta`

Requires:

- authenticated user;
- `contents.read`.

Implemented behavior:

- Returns only sections allowed for the active role editorial scope.
- Returns content types according to existing content type access rules.
- Does not expose additional legacy fields.

### `POST /contents/admin`

Requires:

- authenticated user;
- `contents.write`;
- target `sectionId` inside active role editorial scope.

Implemented behavior:

- If `sectionId` is outside scope, return a safe authorization error and do not persist content, SEO, revision, FriendlyUrl, or audit side effects.
- A public section (`Section.accessPolicy = "public"`) still requires explicit `RoleSectionAccess` before editorial create is allowed.
- If payload attempts to publish, `contents.publish` remains required.

### `PATCH /contents/admin/:id`

Requires:

- authenticated user;
- `contents.write`;
- existing content section in scope;
- target `sectionId` in scope when moving content.

Implemented behavior:

- If current or target section is outside scope, return a safe authorization error and do not persist partial changes.
- Publication changes remain gated by `contents.publish`.

## Public Policy Regression Contract

- Public content policy remains separate from editorial scope.
- Published public content in public sections remains eligible for public endpoints when the other public policy rules pass.
- Restricted public policies do not grant editorial/admin permission.
- `contents.publish` remains required even when the target section is inside the user's editorial scope.

## Error Contract

Out-of-scope operations should return 403 Forbidden with a generic message. The response must not include content body, section internals, legacy identifiers, or sensitive details.

## Out Of Scope

- New public endpoints.
- Portal route changes.
- Preview authenticated flow.
- Workflow routing.
- Multi-section content.
- Public restricted-section authorization.
