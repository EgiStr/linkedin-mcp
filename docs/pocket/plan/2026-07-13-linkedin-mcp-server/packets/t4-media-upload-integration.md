---
### Task T4: Media Upload Integration — modify linkedin_create_post with media_url [depends: T3]
---

## OBJECTIVE
Integrate the media upload pipeline (T3) into the existing `linkedin_create_post` tool. Add `media_url` parameter to the Zod schema and wire it through to the uploader.

Files:
- Modify: `src/tools/posts.ts` — add media_url to CreatePostSchema, update handler
- Modify: `src/services/linkedin-client.ts` — ensure createPost media parameter works with image URN
- Test: `tests/tools/posts.test.ts`

## REFERENCES LOADED
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — Story 2 (Posts & Content), Scenario "Create post with image"
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — Section 3.3 tool API contract, Section 4.4 media upload flow (step 4: attach to post)
- `src/tools/posts.ts` — Current CreatePostSchema (no media_url), createPost handler
- `src/services/linkedin-client.ts` — createPost() method, media parameter already exists in interface
- `src/media/uploader.ts` — uploadImage() method from T3

## WHY THIS APPROACH
**Integration task** — bridges the media upload pipeline with the existing post creation flow. The `createPost` client method already has an optional `media` parameter. This task surfaces it to the MCP tool layer and adds the upload orchestration.

Flow: tool receives media_url → uploader.uploadImage(media_url, token) → get image URN → pass URN to client.createPost({ media: { url: imageUrn } })

**Complexity:** Low. Mostly wiring — the heavy logic is in T3 (uploader).

## SANDWICH CONTEXT
**Architecture constraints:**
- Existing `client.createPost()` already accepts `media: { url: string, altText?: string }` — the `url` field is repurposed to accept image URN string
- The `media_url` parameter in the tool accepts either a URL (for downloading) or a local file path
- Image download from remote URL uses axios.get with responseType: stream
- Local file path uses fs.createReadStream
- Post content with media has 3000-char limit that includes alt text
- Tool schema follows Zod strict pattern (add media_url as optional string)

**Error handling:**
- media_url validation: must be a valid URL or absolute file path
- Remote URL download failure → NETWORK_ERROR
- Upload pipeline failure → pass through uploader error
- Post creation failure after upload → image already uploaded (orphaned) — document as known limitation

## DELIVERABLE
Acceptance criteria verified:
- **Story 2, Scenario "Create post with image"**: media_url → upload → attach → post published
- **Story 2, Scenario "Create text post"**: existing behavior preserved for posts without media

## QUALITY BAR
**Must-haves:**
- `media_url` field added to CreatePostSchema as optional z.string()
- Schema validation: if media_url provided, must be valid URL (absolute URL or file path)
- Handler checks for media_url, calls uploadImage if present, passes URN to client.createPost
- Existing text-only posts continue working unchanged
- Error messages clearly indicate which step failed (upload vs post creation)
- Response includes image Urn when media was attached
- Error for empty media_url is clear and actionable

**Must-nots:**
- No breaking changes to existing tool interface — media_url is optional
- No changes to existing test behavior for text-only posts
- No new dependencies — uses existing axios for remote downloads
- No video support — media_url is image-only in v1

## STOP CONDITIONS
**Done:** All test scenarios pass:
- `npm test -- tests/tools/posts.test.ts` → ✅ PASS
- Text-only post matches existing behavior
- Post with valid media_url: upload triggered, URN attached, post created
- Post with invalid media_url: returns validation error
- Post with network URL download failure: returns error
- JSON and markdown response formats both supported with media

**Escalate:** LinkedIn post endpoint rejects image URN format, upload pipeline fails silently
