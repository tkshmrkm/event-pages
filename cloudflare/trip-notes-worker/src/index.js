const MAX_BODY_BYTES = 512 * 1024;
const EVENT_KEY = /^[A-Za-z0-9._-]{1,80}$/;

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      if (!allowedOrigin(request, env)) return json(request, env, { error:'origin_not_allowed' }, 403);
      return new Response(null, { status:204, headers:headers(request, env) });
    }
    const match = url.pathname.match(/^\/v1\/trips\/([^/]+)$/);
    if (!match) return json(request, env, { error:'not_found' }, 404);
    return handleTrip(request, env, decodeURIComponent(match[1]));
  }
};
