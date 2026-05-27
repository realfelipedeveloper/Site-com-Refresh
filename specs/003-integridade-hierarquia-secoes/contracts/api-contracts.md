# API Contracts: Integridade de hierarquia e caminhos de secoes

**Status**: Planned; no runtime contract change implemented yet.

## Contract Principle

Section hierarchy integrity is enforced by the API. The admin UI may submit parent/name/slug/order changes, but the backend owns path normalization, cycle rejection and FriendlyUrl synchronization.

## Existing Endpoints Affected

### `PATCH /sections/admin/:id`

Requires existing authentication and permission behavior.

Planned behavior:

- Rejects `parentId` equal to the section id.
- Rejects `parentId` pointing to a descendant.
- Recalculates the section path when name, slug or parent changes.
- Recalculates descendant paths when ancestor path changes.
- Updates section FriendlyUrl records for every affected section.
- Rejects path/FriendlyUrl collisions with safe errors.
- Does not partially persist a hierarchy move when any descendant path cannot be updated.

### `GET /sections/admin`

Planned behavior:

- Returns sections with coherent `path` values after moves/renames.
- Preserves existing ordering contract.
- Does not add legacy fields such as `secao_dna` or `secao_nome_ordem`.

## Error Contract

- Invalid parent/cycle: safe 400-style validation error.
- Path or FriendlyUrl collision: safe conflict/validation error.
- Errors must not expose legacy SQL, filesystem paths or sensitive data.

## Out Of Scope

- New public routes.
- Portal layout or menu changes.
- Public access policy changes.
- Multi-section content.
- Workflow routing.
