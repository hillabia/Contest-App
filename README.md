# Contest App

Open-source platform for photo contests: photo submissions, anonymous gallery, ranked voting, tie-break rounds, and manually revealed podiums.

**Status: architecture starter only — not production-ready.** Registration, authentication, voting, admin dashboard, and data deletion are not implemented yet.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before submitting changes.

## Privacy and reuse

The planned lifecycle is: registration → voting → tie-break (if necessary) → manual reveal → **separate admin-confirmed finalization and deletion**. After the award ceremony, the administrator can permanently delete all participant names, photos, access codes, ballots, scores, and rounds, then start a new contest. Revealing winners **does not automatically erase data**. Deletion will be implemented and tested before real use.

## Architecture and contributing

See [ARCHITECTURE.md](ARCHITECTURE.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [SECURITY.md](SECURITY.md). SOLID and Clean Architecture are required. Submit changes through pull requests; the maintainer decides which PRs are merged.

## License

MIT. See [LICENSE](LICENSE).
