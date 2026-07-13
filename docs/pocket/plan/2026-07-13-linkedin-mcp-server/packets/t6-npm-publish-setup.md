---
### Task T6: npm Publish Setup — package.json metadata, README badges [depends: T5]
---

## OBJECTIVE
Prepare the package for npm publish. Add publishConfig, keywords, homepage, repository, bugs fields to package.json. Update README with badges, OAuth setup instructions, and new tool listings.

Files:
- Modify: `package.json` — add publish metadata
- Modify: `README.md` — add badges, OAuth setup, new tool table
- Modify: `.env.example` — add LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET

## REFERENCES LOADED
- `package.json` — Current state, no publishConfig, no npm-specific fields
- `README.md` — Current README, no badges, no OAuth section
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — npm publish as success metric
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — Section 2.1 module structure, tool listing

## WHY THIS APPROACH
**Release task** — pure metadata and documentation. No logic changes. Package.json gets standard npm publish fields (publishConfig, files, keywords, etc.). README gets badges from shields.io and updated tool listings including new auth and media tools.

**Complexity:** Low. Documentation + configuration only.

## SANDWICH CONTEXT
**Architecture constraints:**
- Package name: `@eggisatriadev/linkedin-mcp` (per spec) or current name `linkedin-mcp-server`
- License: MIT
- Node.js >=18 engines constraint
- ESM only ("type": "module")
- Main entry: dist/index.js

## DELIVERABLE
- package.json with publishConfig, files array, keywords, repository, bugs, homepage
- README with:
  - npm version badge
  - build status badge (GitHub Actions)
  - license badge
  - Node version badge
  - Updated tool table with linkedin_oauth_login and linkedin_upload_media
  - OAuth PKCE setup section
  - Quick start with npm install
- .env.example with LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET added

## QUALITY BAR
**Must-haves:**
- `package.json` includes: `"publishConfig": { "access": "public" }` or `"private": false`
- `"files"` array includes: `dist/`, `README.md`, `LICENSE`, `package.json`
- Keywords: linkedin, mcp, model-context-protocol, api, linkedin-api, oauth
- `"repository"` field with correct git URL
- README badges use shields.io dynamic URLs or static SVG
- Tool table includes all 11 tools (9 existing + 2 new)

**Must-nots:**
- No secrets in package.json or README
- No semver range changes — keep ^ dependencies as-is
- No new scripts that side-effect publish

## STOP CONDITIONS
**Done:**
- `npm pack --dry-run` lists correct files
- `node -e "require('./package.json')"` parses successfully
- README renders correctly with badges
- `.env.example` has all required env vars

**Escalate:** Package name conflicts with existing npm package, GitHub Actions badge URL unreachable
