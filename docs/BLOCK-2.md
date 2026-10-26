# Block 2 — Rounds, results and tiebreaks

## Implemented
- Pure score aggregation by average of normalized points.
- Competition ranking and detection of tied groups intersecting podium positions.
- Time-window policies for tiebreak rounds.
- Filtering of eligible voters when entrants would otherwise have only one other candidate.
- Server-only results use case and Supabase adapter; no public results endpoint.
- Unit tests for scoring, ranking, tie detection, time windows and reveal conditions.

## Rules
- No public score or winner disclosure before an administrator explicitly reveals the podium.
- The initial regular round ranks all eligible photographs, excluding the voter's own.
- A tiebreak uses only the entries tied for podium-relevant positions.
- With two tied photographs, their own entrants cannot vote: they would have only one eligible option. Guests and other eligible participants can vote.
- Scores are averages, not sums. An entry without any received votes remains unranked (null), never silently scored as zero.
- Each ballot is immutable and limited to one per code per round.
- Unresolved ties require another tiebreak round. If no eligible ballots exist, the system must remain unresolved and ask the administrator to invite eligible guest voters; do not invent a winner.
- Once winners are revealed, deletion is a separate explicit administrator action.

## Still to implement
- Secure single-admin authentication/authorization (required before any admin route).
- Transactional round opening/closing and freezing eligible entries.
- Tie-break round creation and result composition across multiple rounds.
- Admin-configurable durations and deadline enforcement.
- Podium display, flip-to-reveal names and administrator reveal command.
- Rate limiting, lockfile, integration tests, production deployment.

**Do not expose privileged results through a public API or publish this MVP as production-ready.**
