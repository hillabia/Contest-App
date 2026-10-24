# Architecture

Clean Architecture: domain <- application <- infrastructure/presentation.

- `src/domain`: entities, value objects, pure policies and ports; no framework imports.
- `src/application`: use cases depend on domain contracts.
- `src/infrastructure`: database, storage and auth adapters.
- `src/app`: Next.js UI and delivery.

Apply SOLID without unnecessary abstractions. Keep scoring independent of persistence and UI.

## Scoring
Eligible designs are ranked from 100 to 0 with `100*(m-r)/(m-1)` for `m>1`. Participant's own entry is excluded. Each design's result is the average score received. The eligible set is frozen per round.

## Contest lifecycle and privacy
`registration -> voting -> tiebreak (if needed) -> awaiting_reveal -> revealed -> archived/purged`.

Revealing results **never** automatically deletes data. After the ceremony, an administrator can explicitly choose "Finalize and erase" with a destructive-action confirmation. The operation must revoke participant sessions, delete ballots, rankings, entries, names, access codes, tie-break rounds, derived scores, uploaded images and cached public artifacts, and verify storage cleanup. Retain only nonpersonal application configuration and admin credentials. Make cleanup idempotent, transactional where possible, and recoverable from partial storage failures through retries. Once purged, a fresh contest may be created.

No personal submissions, secrets or production data in git. Server-side checks for deadlines, identity and vote integrity are mandatory.
