const MAX_BODY_BYTES = 512 * 1024;
const EVENT_KEY = /^[A-Za-z0-9._-]{1,80}$/;
const ENTRY_ID = /^[A-Za-z0-9_-]{8,80}$/;
const MAX_ENTRY_BYTES = 16 * 1024;

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : '';
}

function headers(request, env, extra = {}) {
  const origin = allowedOrigin(request, env);
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    ...(origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Trip-Sync-Key',
      'Access-Control-Max-Age': '86400'
    } : {}),
    ...extra
  };
}

function json(request, env, value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers:headers(request, env) });
}

function safeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (!a || !b || a.length !== b.length) return false;
  let different = 0;
  for (let index = 0; index < a.length; index += 1) different |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return different === 0;
}

function authorized(request, env) {
  return safeEqual(request.headers.get('X-Trip-Sync-Key'), env.SYNC_TOKEN);
}

function cleanData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('data must be an object');
  return Object.fromEntries(Object.entries(data).filter(([key]) => !key.startsWith('ui:')));
}

async function handleTrip(request, env, eventKey) {
  if (!authorized(request, env)) return json(request, env, { error:'unauthorized' }, 401);
  if (!EVENT_KEY.test(eventKey)) return json(request, env, { error:'invalid_event_key' }, 400);
  const storageKey = 'trip:' + eventKey;

  if (request.method === 'GET') {
    const result = await env.TRIP_NOTES.getWithMetadata(storageKey, 'json');
    if (!result.value) return json(request, env, { error:'not_found' }, 404);
    return json(request, env, { ...result.value, updatedAt:result.metadata && result.metadata.updatedAt });
  }

  if (request.method === 'PUT') {
    const declaredLength = Number(request.headers.get('Content-Length') || 0);
    if (declaredLength > MAX_BODY_BYTES) return json(request, env, { error:'payload_too_large' }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json(request, env, { error:'payload_too_large' }, 413);
    let value;
    try { value = JSON.parse(raw); }
    catch(e) { return json(request, env, { error:'invalid_json' }, 400); }
    if (!value || value.schema !== 'trip-field-records' || value.version !== 1 || value.eventKey !== eventKey) {
      return json(request, env, { error:'invalid_payload' }, 400);
    }
    try { value.data = cleanData(value.data); }
    catch(e) { return json(request, env, { error:'invalid_data' }, 400); }
    const updatedAt = new Date().toISOString();
    const stored = { ...value, savedAt:updatedAt };
    await env.TRIP_NOTES.put(storageKey, JSON.stringify(stored), { metadata:{ updatedAt } });
    return json(request, env, { ok:true, eventKey, updatedAt });
  }

  return json(request, env, { error:'method_not_allowed' }, 405);
}

function cleanEntry(value, eventKey, entryId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('entry must be an object');
  const fieldKey = String(value.fieldKey || '').trim();
  const author = String(value.author || '').trim();
  const text = String(value.text || '').trim();
  const clientTime = String(value.clientTime || '').trim();
  if (!fieldKey || fieldKey.length > 160 || /[\u0000-\u001f]/.test(fieldKey)) throw new Error('invalid field key');
  if (!author || author.length > 60) throw new Error('invalid author');
  if (!text || text.length > 8000) throw new Error('invalid text');
  if (!clientTime || clientTime.length > 80) throw new Error('invalid client time');
  return { id:entryId, eventKey, fieldKey, author, text, clientTime };
}

async function listEntries(env, eventKey) {
  const prefix = 'entry:' + eventKey + ':';
  const entries = [];
  let cursor;
  do {
    const page = await env.TRIP_NOTES.list({ prefix, cursor });
    const values = await Promise.all(page.keys.map(key => env.TRIP_NOTES.get(key.name, 'json')));
    values.filter(Boolean).forEach(value => entries.push(value));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  entries.sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')) || left.id.localeCompare(right.id));
  return entries;
}

async function handleEntries(request, env, eventKey, entryId) {
  if (!authorized(request, env)) return json(request, env, { error:'unauthorized' }, 401);
  if (!EVENT_KEY.test(eventKey)) return json(request, env, { error:'invalid_event_key' }, 400);

  if (request.method === 'GET' && !entryId) {
    return json(request, env, { eventKey, entries:await listEntries(env, eventKey) });
  }

  if (request.method === 'PUT' && entryId) {
    if (!ENTRY_ID.test(entryId)) return json(request, env, { error:'invalid_entry_id' }, 400);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_ENTRY_BYTES) return json(request, env, { error:'payload_too_large' }, 413);
    let value;
    try { value = cleanEntry(JSON.parse(raw), eventKey, entryId); }
    catch(e) { return json(request, env, { error:'invalid_entry' }, 400); }
    const createdAt = new Date().toISOString();
    const stored = { ...value, createdAt };
    await env.TRIP_NOTES.put('entry:' + eventKey + ':' + entryId, JSON.stringify(stored));
    return json(request, env, { ok:true, entry:stored });
  }

  return json(request, env, { error:'method_not_allowed' }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      if (!allowedOrigin(request, env)) return json(request, env, { error:'origin_not_allowed' }, 403);
      return new Response(null, { status:204, headers:headers(request, env) });
    }
    const entryMatch = url.pathname.match(/^\/v1\/trips\/([^/]+)\/entries(?:\/([^/]+))?$/);
    if (entryMatch) return handleEntries(request, env, decodeURIComponent(entryMatch[1]), entryMatch[2] && decodeURIComponent(entryMatch[2]));
    const tripMatch = url.pathname.match(/^\/v1\/trips\/([^/]+)$/);
    if (!tripMatch) return json(request, env, { error:'not_found' }, 404);
    return handleTrip(request, env, decodeURIComponent(tripMatch[1]));
  }
};
