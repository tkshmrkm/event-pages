import worker from './src/index.js';

const values = new Map();
const metadata = new Map();
const env = {
  SYNC_TOKEN:'test-only-token',
  ALLOWED_ORIGINS:'https://tkshmrkm.github.io,http://localhost:5511',
  TRIP_NOTES:{
    async getWithMetadata(key){ return { value:values.has(key) ? JSON.parse(values.get(key)) : null, metadata:metadata.get(key) || null }; },
    async put(key, value, options){ values.set(key, value); metadata.set(key, options && options.metadata || null); }
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

console.log('trip-notes-worker acceptance checks: OK');
