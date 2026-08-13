import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
const runtime = fs.readFileSync(path.join(here, 'runtime.js'), 'utf8');
const core = fs.readFileSync(path.join(here, 'core.css'), 'utf8');

function assert(value, message){ if (!value) throw new Error(message); }

new Function(runtime);
assert((template.match(/data-trip-tab=/g) || []).length === 3, 'template: expected three primary tabs');
assert((template.match(/data-trip-panel=/g) || []).length === 3, 'template: expected three primary panels');
assert(template.includes('data-trip-store="venue:target-01:prep"'), 'template: venue preparation field missing');
assert(template.includes('data-trip-store="venue:target-01:day"'), 'template: venue day-note field missing');
assert(template.includes('data-trip-append-timestamp'), 'template: timestamp append control marker missing');
assert(template.includes('data-trip-export-json') && template.includes('data-trip-import-json'), 'template: JSON transfer controls missing');
assert(template.includes('data-trip-download-markdown'), 'template: Markdown download control missing');
assert(template.includes('data-trip-cloud') && template.includes('data-trip-cloud-key') && template.includes('data-trip-cloud-author'), 'template: Cloudflare sync controls missing');
assert(runtime.includes('createCloudSync') && runtime.includes('X-Trip-Sync-Key'), 'runtime: Cloudflare sync support missing');
assert(runtime.includes('downloadText') && runtime.includes('text/markdown;charset=utf-8'), 'runtime: Markdown download support missing');
assert(runtime.includes('mountAppend') && runtime.includes('appendEntry') && runtime.includes('localTimestamp'), 'runtime: shared append support missing');
assert(runtime.includes("request('/entries'") && runtime.includes('data-trip-entry-id'), 'runtime: shared entry loading/export missing');
assert(core.includes('min-height:44px') && core.includes('font:16px/1.55'), 'core.css: touch/input sizing contract missing');
assert(core.includes('.trip-timestamp-button') && core.includes('.trip-shared-entry'), 'core.css: shared append control styles missing');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trip-field-'));
const offlinePath = path.join(tempDir, 'template_desk_print.html');
try {
  const run = spawnSync(process.execPath, [path.join(here, 'build-desk-print.mjs'), path.join(here, 'template.html'), offlinePath], { encoding:'utf8' });
  if (run.status !== 0) throw new Error(run.stderr || run.stdout || 'offline build failed');
  const offline = fs.readFileSync(offlinePath, 'utf8');
  assert(!/<link\b[^>]*rel=["']stylesheet["']/i.test(offline), 'offline template: stylesheet link remains');
  assert(!/<script\b/i.test(offline), 'desk-print template: interactive script remains');
  assert(offline.includes('data-trip-copy="desk-print"') && offline.includes('机上用印刷版'), 'desk-print template: print identity missing');
  assert(offline.includes('body.trip-desk-copy [data-trip-panel="records"]'), 'desk-print template: record-form exclusion missing');
} finally {
  fs.rmSync(tempDir, { recursive:true, force:true });
}

console.log('trip-field template and desk print: acceptance checks OK');
