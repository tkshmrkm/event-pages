# Trip Notes Cloudflare Worker

Cloudflare Workers KV backend for the shared overseas-trip field layout. The
static page keeps a local copy and sends the same `trip-field-records` payload
to this Worker. The synchronization key is entered in the page at runtime and
is never committed into public HTML.

## Current deployment

- Worker: `https://trip-field-sync.mrkn55.workers.dev`
- KV binding: `TRIP_NOTES`
- Authentication: Worker Secret `SYNC_TOKEN`
- Allowed production origin: `https://tkshmrkm.github.io`

The secret value is held by the user and is not stored in this repository.

## Deploy

1. Install dependencies with `npm install`.
2. Create a KV namespace:

   ```powershell
   npx wrangler kv namespace create TRIP_NOTES
   ```

3. Put the returned namespace ID in `wrangler.jsonc`.
4. Add a long random synchronization key as a Worker secret:

   ```powershell
   npx wrangler secret put SYNC_TOKEN
   ```

5. Deploy with `npm run deploy`.
6. Copy the resulting Worker URL into each event page's `data-endpoint` value.

Do not put `SYNC_TOKEN` in `wrangler.jsonc`, GitHub Pages, or any committed
file. The browser may remember it locally only when the user selects that
option. Rotate the existing LSP application's public client key separately;
this Worker deliberately does not reuse it.

## Behavior

- `GET /v1/trips/:eventKey` loads one trip snapshot.
- `PUT /v1/trips/:eventKey` stores one trip snapshot.
- `GET /v1/trips/:eventKey/entries` lists named shared-note entries.
- `PUT /v1/trips/:eventKey/entries/:entryId` stores one append entry under a unique key.
- `X-Trip-Sync-Key` is required for both operations.
- Only configured GitHub Pages and local-development origins receive CORS access.
- UI-only keys are removed before cloud storage.
- The client waits 2.2 seconds after editing before saving, which stays below
  Workers KV's one-write-per-second limit for a single key.
- Shared-note entries do not update the trip snapshot key. Concurrent users
  write different entry IDs, so one append does not overwrite the other.

Run the dependency-free Worker checks with:

```powershell
node .\validate-worker.mjs
```
