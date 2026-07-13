---
### Task T7: Final Review + Git Tag [depends: T6]
---

## OBJECTIVE
Final quality gate before release. Run full test suite, type check, lint, build. Create an execution summary, commit all changes, and tag the release.

Files:
- All files from T1-T6
- Test: `npm test` — full suite
- Test: `npm run build` — TypeScript compilation
- New: `git tag v1.1.0`

## REFERENCES LOADED
- All packet files T1-T6
- `package.json` — scripts: test, build, clean
- `tsconfig.json` — TypeScript config
- `.github/workflows/ci.yml` — CI pipeline for reference
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — Success metrics

## WHY THIS APPROACH
**Quality gate** — verifies everything works together before git tag. Runs the full pipeline: clean → build → test. If any step fails, the agent must fix before tagging.

## SANDWICH CONTEXT
**Architecture constraints:**
- No real LinkedIn API calls in CI — all tests use nock mocks
- Strict TypeScript — `tsc` must compile without errors
- All tests must pass with `vitest run` (not just watch mode)

## DELIVERABLE
- Successful: `npm run build`
- Successful: `npm test` (all 70+ tests passing)
- Successful: `git commit -m "v1.1.0: OAuth PKCE flow, media upload, npm publish"`
- Successful: `git tag v1.1.0`

## QUALITY BAR
**Must-haves:**
- `npm run clean` succeeds
- `npm run build` produces dist/ with no errors
- `npm test` passes with zero failures
- All code follows existing conventions (no new lint issues)
- Git commit includes all staged files
- Git tag matches package.json version

**Must-nots:**
- No breaking changes to existing tools
- No real API calls in test suite
- No skipped or failing tests (pending = fail)

## STOP CONDITIONS
**Done:**
- `npm run build` → 0 errors
- `npm test` → all tests pass
- Git tag created

**Escalate:** Build errors due to TypeScript strict mode, test failures (must fix before proceeding), git tag conflicts (force tag after confirmation)
