---
### Task T3: Media Upload Infrastructure — uploader.ts [prereq]
---

## OBJECTIVE
Create the 3-step media upload pipeline for LinkedIn images. This is the foundation for T4 (media upload integration in create_post).

Files:
- Create: `src/media/uploader.ts`
- Create: `src/tools/media.ts`
- Test: `tests/media/uploader.test.ts`

## REFERENCES LOADED
- `docs/pocket/spec/2026-07-13-linkedin-mcp-server/research-spec.md` — Story 5 (Media Upload), 2 scenarios
- `docs/pocket/arch/2026-07-13-linkedin-mcp-server/tech-design.md` — Section 1.2.4 Media Upload Pipeline, flow diagram, file size limits
- `src/services/linkedin-client.ts` — LinkedInClient constructor, axios instance, LINKEDIN_API_VERSION, API_REST, createPost media parameter
- `src/tools/posts.ts` — Existing createPost handler for reference
- `src/types.ts` — ToolEntry, ResponseFormat

## WHY THIS APPROACH
**Scaffolding task** — implements the LinkedIn 3-step media upload process as a standalone module. Separated from LinkedInClient to keep the client focused on API methods; the uploader has distinct concerns (binary upload, file validation, retry).

The LinkedIn upload flow:
1. POST /rest/images?action=initializeUpload → get uploadUrl + image URN
2. PUT binary file to uploadUrl with Content-Type: image/jpeg or image/png
3. GET /rest/images/{imageId} → confirmed image URN

Tools/media.ts wraps this as the `linkedin_upload_media` tool following the factory pattern.

**Complexity:** Medium. Binary upload, file system access, content-type detection.

## SANDWICH CONTEXT
**Architecture constraints:**
- Supported formats: JPEG, PNG, GIF (static only)
- Max file size: 10MB (LinkedIn limit)
- Max dimensions: 2048×2048px (recommended, not enforced)
- Content-Type auto-detection via file extension or mime-type lookup
- Upload method uses the same Axios instance pattern as LinkedInClient (but instantiates its own for binary upload)
- Uploader receives the access token string, not a LinkedInClient instance — keeps coupling loose

**Error handling:**
- Invalid file path → structured error with code
- Unsupported file type → structured error
- File >10MB → structured error
- LinkedIn API failure during init → pass through structured error
- Binary upload failure → retryable error
- URN confirmation failure → retryable error

## DELIVERABLE
Acceptance criteria verified:
- **Story 5, Scenario "Image upload flow"**: Init → binary upload → URN retrieval
- **Story 5, Scenario "Invalid media format"**: Unsupported type returns error

## QUALITY BAR
**Must-haves:**
- `uploader.ts` must export: `initializeUpload()`, `uploadBinary()`, `getImageUrn()`, `uploadImage()`
- `uploadImage()` is the orchestration method that calls step 1, 2, 3 in sequence
- File validation: extension check (.jpg, .jpeg, .png, .gif), size check (<10MB)
- Content-Type derived from file extension
- Binary upload uses PUT with raw binary body
- All LinkedIn API calls include LinkedIn-Version header
- `tools/media.ts` follows existing factory pattern (createMediaTools)
- Error responses use LinkedInErrorCode patterns

**Must-nots:**
- No image processing/resizing — v1 assumes images are already correctly sized
- No support for video upload — LinkedIn video API requires separate flow
- No in-memory buffer for files >10MB — use streaming (fs.createReadStream)
- Uploader must not depend on LinkedInClient class — uses axios directly

**Open question risks:**
- LinkedIn's /rest/images endpoint response shape isn't documented — may need real API testing to finalize
- GIF support may be limited by LinkedIn — document as best-effort

## STOP CONDITIONS
**Done:** All test scenarios pass:
- `npm test -- tests/media/uploader.test.ts` → ✅ PASS
- `initializeUpload` mocks POST /rest/images and returns uploadUrl + image URN
- `uploadBinary` mocks PUT and returns success
- `getImageUrn` mocks GET /rest/images/{id} and returns image URN
- `uploadImage` orchestrates all 3 steps and returns final URN
- Invalid file type returns error
- File >10MB returns error
- Tool handler formats success/error correctly

**Escalate:** LinkedIn /rest/images API structure differs from documented spec, file system permission issues in test environment
