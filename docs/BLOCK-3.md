# Block 3 — MVP administration and contest lifecycle

Development branch: `feature/mvp-admin-lifecycle`, based on `feature/results-rounds` (PR #2).

## Implemented
- Server-only constant-time comparison for an administrator API token (minimum 32 characters), default deny.
- Protected contest creation endpoint with strict input and date validation.
- Protected regular-round start endpoint that delegates the atomic transition to PostgreSQL.
- SQL migration for atomic initial-round creation.

## Temporary authentication model
The `CONTEST_ADMIN_API_TOKEN` environment variable must be a high-entropy secret, set only on the server. The current routes require an `Authorization: Bearer ...` header. **Do not put this token in browser code, local storage or a public environment variable.** A proper single-admin login and short-lived session must replace this temporary API gate before public deployment.

## Still pending
- Single-admin login and session UI; guest code generation.
- Admin UI for configuring contests and tiebreaks.
- Transactional close, tie-break orchestration and final results composition.
- Reveal endpoint, podium UI, full-data deletion with storage cleanup and audit.
- End-to-end tests, abuse prevention, deployment.
