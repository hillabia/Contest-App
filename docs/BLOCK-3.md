# Block 3 — MVP administration and contest lifecycle

Development branch: `feature/mvp-admin-lifecycle`, based on PR #2.

## Implemented
- Verified Supabase Auth identity against the single configured administrator user ID (`CONTEST_ADMIN_USER_ID`) in all administrative API routes.
- Protected contest creation, guest access-code issuance, regular round start and deadline-based close.
- Atomic SQL transitions for regular round start and round close, applied and permissions verified in `contest-app-dev`.
- Protected server-side results and podium tie preview.
- Pure lifecycle policies and unit tests.

## Security and deployment
- Configure `CONTEST_ADMIN_USER_ID` to the administrator's Supabase Auth UUID. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browsers.
- The old token helper is superseded and should be removed before release.
- A browser login and session workflow remains to be implemented.
- The new SQL for tie-break/finalize/reveal is committed for review but has **not** been applied to Supabase.
- The tie-break and reveal endpoints currently return 501 intentionally; do not bypass this guard.
- No end-to-end tests or CI validation have been confirmed.

## Critical MVP blockers
1. Transactional server verification of which podium ties require a tie-break and how multiple tie-breaks compose final rankings.
2. Reveal and finalization only when all rounds have closed and all podium ties have been resolved.
3. Public podium UI with name reveal and signed image links.
4. Confirmed, retryable purge of storage objects and related database rows.
5. Single-admin login and session UI.
6. End-to-end integration tests, rate limiting, lockfile and production deployment.

Do not mark this PR ready for merge until all critical blockers are addressed and tests pass.
