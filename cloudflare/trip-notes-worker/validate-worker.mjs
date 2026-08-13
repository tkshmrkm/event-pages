import worker from './src/index.js';

const values = new Map();
const metadata = new Map();
const env = {
  SYNC_TOKEN:'test-only-token',
  ALLOWED_ORIGINS:'https://tkshmrkm.github.io,http://localhost:5511',
  TRIP_NOTES:{
    async getWithMetadata(key){ return { value:values.has(key) ? JSON.parse(values.get(key)) : null, metadata:metadata.get(key) || null }; },
    async get(key, type){ const value = values.get(key); return type === 'json' && value ? JSON.parse(value) : value || null; },
    async put(key, value, options){ values.set(key, value); metadata.set(key, options && options.metadata || null); },
    async list({ prefix }){ return { keys:Array.from(values.keys()).filter(key => key.startsWith(prefix)).map(name => ({ name })), list_complete:true }; }
  }
};
const url = 'https://trip-field-sync.example.workers.dev/v1/trips/test-trip';
const baseHeaders = { Origin:'https://tkshmrkm.github.io', 'X-Trip-Sync-Key':'test-only-token' };
const assert = (condition, message) => { if (!condition) throw new Error(message); };

let response = await worker.fetch(new Request(url, { method:'GET', headers:baseHeaders }), env);
assert(response.status === 404, 'empty GET should return 404');

const payload = { schema:'trip-field-records', version:1, eventKey:'test-trip', exportedAt:new Date().toISOString(), data:{ 'trip:aim':'test', 'ui:tab':'records' } };
response = await worker.fetch(new Request(url, { method:'PUT', headers:{ ...baseHeaders, 'Content-Type':'application/json' }, body:JSON.stringify(payload) }), env);
assert(response.status === 200, 'valid PUT should succeed');

response = await worker.fetch(new Request(url, { method:'GET', headers:baseHeaders }), env);
const saved = await response.json();
assert(response.status === 200 && saved.data['trip:aim'] === 'test', 'saved data should round-trip');
assert(!('ui:tab' in saved.data), 'UI state must not be stored in cloud');

response = await worker.fetch(new Request(url, { method:'GET', headers:{ ...baseHeaders, 'X-Trip-Sync-Key':'wrong' } }), env);
assert(response.status === 401, 'wrong key should be rejected');

response = await worker.fetch(new Request(url, { method:'OPTIONS', headers:{ Origin:'https://tkshmrkm.github.io', 'Access-Control-Request-Method':'PUT' } }), env);
assert(response.status === 204 && response.headers.get('Access-Control-Allow-Origin') === 'https://tkshmrkm.github.io', 'allowed CORS preflight should succeed');

const entriesUrl = url + '/entries';
const firstEntry = { fieldKey:'rec:day-01:day', author:'村上', text:'最初のメモ', clientTime:'2026-08-13 14:30 UTC+09:00' };
const secondEntry = { fieldKey:'rec:day-01:day', author:'同行者', text:'同時追記', clientTime:'2026-08-13 14:31 UTC+09:00' };
response = await worker.fetch(new Request(entriesUrl + '/entry_test_0001', { method:'PUT', headers:{ ...baseHeaders, 'Content-Type':'application/json' }, body:JSON.stringify(firstEntry) }), env);
assert(response.status === 200, 'first append entry should succeed');
response = await worker.fetch(new Request(entriesUrl + '/entry_test_0002', { method:'PUT', headers:{ ...baseHeaders, 'Content-Type':'application/json' }, body:JSON.stringify(secondEntry) }), env);
assert(response.status === 200, 'second append entry should succeed');
response = await worker.fetch(new Request(entriesUrl, { method:'GET', headers:baseHeaders }), env);
const entries = await response.json();
assert(response.status === 200 && entries.entries.length === 2, 'independent append entries should both survive');
assert(entries.entries.some(entry => entry.author === '村上') && entries.entries.some(entry => entry.author === '同行者'), 'entry authors should round-trip');

console.log('trip-notes-worker acceptance checks: OK');
