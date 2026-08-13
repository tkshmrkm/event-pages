(function(global){
  'use strict';

  const SCHEMA = 'trip-field-records';
  const VERSION = 1;

  function createStore(eventKey){
    if (!eventKey) throw new Error('TripField requires an event key');
    const prefix = eventKey + ':';
    const listeners = new Set();
    const notify = (key, value) => listeners.forEach(listener => listener(key, value));
    return {
      eventKey,
      get(key, fallback){
        try {
          const raw = localStorage.getItem(prefix + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch(e) { return fallback; }
      },
      set(key, value){
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value));
          notify(key, value);
          return true;
        }
        catch(e) { return false; }
      },
      del(key){
        try { localStorage.removeItem(prefix + key); return true; }
        catch(e) { return false; }
      },
      keys(){
        try { return Object.keys(localStorage).filter(key => key.startsWith(prefix)); }
        catch(e) { return []; }
      },
      snapshot(){
        const data = {};
        this.keys().forEach(fullKey => {
          const shortKey = fullKey.slice(prefix.length);
          data[shortKey] = this.get(shortKey, null);
        });
        return data;
      },
      restore(data){
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid trip data');
        Object.entries(data).forEach(([key, value]) => this.set(key, value));
      },
      subscribe(listener){
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    };
  }

  function payload(store){
    const data = store.snapshot();
    Object.keys(data).forEach(key => {
      if (key.startsWith('ui:')) delete data[key];
    });
    return {
      schema: SCHEMA,
      version: VERSION,
      eventKey: store.eventKey,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function createCloudSync(options){
    const root = options && options.root || document;
    const store = options && options.store;
    if (!store) throw new Error('TripField cloud sync requires a store');
    const eventKey = options.eventKey || store.eventKey;
    const panel = options.panel || root.querySelector('[data-trip-cloud]');
    if (!panel) return null;
    const endpoint = String(options.endpoint || panel.dataset.endpoint || '').replace(/\/$/, '');
    const tokenInput = panel.querySelector('[data-trip-cloud-key]');
    const authorInput = panel.querySelector('[data-trip-cloud-author]');
    const rememberInput = panel.querySelector('[data-trip-cloud-remember]');
    const pullButton = panel.querySelector('[data-trip-cloud-pull]');
    const pushButton = panel.querySelector('[data-trip-cloud-push]');
    const cloudStatus = panel.querySelector('[data-trip-cloud-status]');
    const tokenStorageKey = 'trip-field-cloud:' + eventKey + ':token';
    const authorStorageKey = 'trip-field-cloud:' + eventKey + ':author';
    let syncing = false;
    let pushTimer = 0;
    let entryPollTimer = 0;
    const entryMap = new Map();
    const entryViews = new Map();

    const say = message => {
      if (cloudStatus) cloudStatus.textContent = message;
      if (options.status) options.status(message);
    };
    const rememberedToken = (() => {
      try { return localStorage.getItem(tokenStorageKey) || ''; }
      catch(e) { return ''; }
    })();
    if (tokenInput) tokenInput.value = rememberedToken;
    if (rememberInput) rememberInput.checked = Boolean(rememberedToken);
    const rememberedAuthor = (() => {
      try { return localStorage.getItem(authorStorageKey) || ''; }
      catch(e) { return ''; }
    })();
    if (authorInput) authorInput.value = rememberedAuthor;

    const token = () => tokenInput ? tokenInput.value.trim() : '';
    const author = () => authorInput ? authorInput.value.trim() : '';
    const remember = () => {
      try {
        if (rememberInput && rememberInput.checked && token()) localStorage.setItem(tokenStorageKey, token());
        else localStorage.removeItem(tokenStorageKey);
      } catch(e) {}
    };
    const rememberAuthor = () => {
      try {
        if (author()) localStorage.setItem(authorStorageKey, author());
        else localStorage.removeItem(authorStorageKey);
      } catch(e) {}
    };
    const setDisabled = disabled => {
      [tokenInput, rememberInput, pullButton, pushButton].forEach(control => { if (control) control.disabled = disabled; });
    };
    if (!endpoint) {
      setDisabled(true);
      say('Cloudflare同期先はまだ設定されていません');
      return { configured:false };
    }

    const request = async (path, method, body) => {
      if (!token()) throw new Error('同期キーを入力してください');
      remember();
      rememberAuthor();
      const response = await fetch(endpoint + '/v1/trips/' + encodeURIComponent(eventKey) + (path || ''), {
        method,
        headers:{
          'Content-Type':'application/json',
          'X-Trip-Sync-Key':token()
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (response.status === 401 || response.status === 403) throw new Error('同期キーが違います');
      if (response.status === 404 && method === 'GET') return null;
      if (!response.ok) throw new Error('クラウド通信に失敗しました（' + response.status + '）');
      return response.json();
    };
    const push = async ({ quiet = false } = {}) => {
      if (syncing) return false;
      syncing = true;
      if (!quiet) say('クラウドへ保存中…');
      try {
        const result = await request('', 'PUT', payload(store));
        say('クラウド保存済み' + (result && result.updatedAt ? ' · ' + new Date(result.updatedAt).toLocaleString() : ''));
        return true;
      } catch(e) {
        say(e.message || 'クラウドへ保存できませんでした');
        return false;
      } finally { syncing = false; }
    };
    const pull = async () => {
      if (syncing) return false;
      if (Object.keys(payload(store).data).length && !confirm('クラウド側の内容で、この端末の記録を更新します。続けますか？')) return false;
      syncing = true;
      say('クラウドから読込中…');
      try {
        const result = await request('', 'GET');
        if (result) {
          if (result.schema !== SCHEMA || result.version !== VERSION || result.eventKey !== eventKey || !result.data) throw new Error('クラウド側のデータ形式が違います');
          store.restore(result.data);
          if (options.onRestore) options.onRestore(result.data);
        }
        await loadEntries({ quiet:true });
        say(result ? 'クラウドから読み込みました' : '共同メモを読み込みました');
        return true;
      } catch(e) {
        say(e.message || 'クラウドから読み込めませんでした');
        return false;
      } finally { syncing = false; }
    };

    const entryId = () => {
      if (global.crypto && typeof global.crypto.randomUUID === 'function') return global.crypto.randomUUID().replace(/-/g, '_');
      return 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 12);
    };
    const entriesFor = fieldKey => Array.from(entryMap.values())
      .filter(entry => entry.fieldKey === fieldKey)
      .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')) || left.id.localeCompare(right.id));
    const renderEntries = fieldKey => {
      const views = entryViews.get(fieldKey);
      if (!views) return;
      const entries = entriesFor(fieldKey);
      views.forEach(view => view(entries));
    };
    const loadEntries = async ({ quiet = false } = {}) => {
      if (!token()) return false;
      try {
        const result = await request('/entries', 'GET');
        (result && result.entries || []).forEach(entry => entryMap.set(entry.id, entry));
        entryViews.forEach((views, fieldKey) => renderEntries(fieldKey));
        return true;
      } catch(e) {
        if (!quiet) say(e.message || '共同メモを読み込めませんでした');
        return false;
      }
    };
    const appendEntry = async (fieldKey, text) => {
      if (!author()) throw new Error('記入者名を入力してください');
      const id = entryId();
      const value = { id, fieldKey, author:author(), text:String(text || '').trim(), clientTime:localTimestamp().slice(1, -1) };
      if (!value.text) throw new Error('追記内容を入力してください');
      const result = await request('/entries/' + encodeURIComponent(id), 'PUT', value);
      if (!result || !result.entry) throw new Error('共同メモを保存できませんでした');
      entryMap.set(result.entry.id, result.entry);
      renderEntries(fieldKey);
      return result.entry;
    };
    const startEntryPolling = () => {
      if (entryPollTimer) return;
      entryPollTimer = global.setInterval(() => { if (!document.hidden && token()) loadEntries({ quiet:true }); }, 20000);
    };
    const mountAppend = (textarea, fieldKey) => {
      if (!textarea || textarea.dataset.tripSharedMounted === '1') return null;
      textarea.dataset.tripSharedMounted = '1';
      const wrap = document.createElement('div');
      wrap.className = 'trip-shared-notes';
      const log = document.createElement('div');
      log.className = 'trip-shared-log';
      log.setAttribute('aria-live', 'polite');
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'trip-timestamp-button trip-no-print';
      toggle.textContent = '＋ 共同メモを追記';
      const composer = document.createElement('div');
      composer.className = 'trip-shared-composer trip-no-print';
      composer.hidden = true;
      const draft = document.createElement('textarea');
      draft.className = 'trip-shared-draft';
      draft.rows = 2;
      draft.placeholder = '追記する内容';
      draft.setAttribute('aria-label', '共同メモの追記内容');
      const actions = document.createElement('div');
      actions.className = 'trip-shared-actions';
      const submit = document.createElement('button');
      submit.type = 'button';
      submit.className = 'trip-timestamp-button';
      submit.textContent = '時刻と名前を付けて追加';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'trip-timestamp-button trip-shared-cancel';
      cancel.textContent = '閉じる';
      const fieldStatus = document.createElement('div');
      fieldStatus.className = 'trip-shared-status';
      fieldStatus.setAttribute('role', 'status');
      actions.append(submit, cancel);
      composer.append(draft, actions, fieldStatus);
      wrap.append(log, toggle, composer);
      textarea.insertAdjacentElement('afterend', wrap);
      const render = entries => {
        log.replaceChildren();
        entries.forEach(entry => {
          const item = document.createElement('div');
          item.className = 'trip-shared-entry';
          item.dataset.tripEntryId = entry.id;
          const meta = document.createElement('div');
          meta.className = 'trip-shared-meta';
          meta.textContent = entry.clientTime + ' · ' + entry.author;
          const body = document.createElement('div');
          body.className = 'trip-shared-text';
          body.textContent = entry.text;
          item.append(meta, body);
          log.appendChild(item);
        });
        log.hidden = entries.length === 0;
      };
      if (!entryViews.has(fieldKey)) entryViews.set(fieldKey, new Set());
      entryViews.get(fieldKey).add(render);
      render(entriesFor(fieldKey));
      toggle.addEventListener('click', () => {
        composer.hidden = !composer.hidden;
        if (!composer.hidden) draft.focus();
      });
      cancel.addEventListener('click', () => { composer.hidden = true; fieldStatus.textContent = ''; });
      submit.addEventListener('click', async () => {
        submit.disabled = true;
        fieldStatus.textContent = '共同メモへ保存中…';
        try {
          await appendEntry(fieldKey, draft.value);
          draft.value = '';
          composer.hidden = true;
          fieldStatus.textContent = '';
          say('共同メモへ追記しました');
        } catch(e) { fieldStatus.textContent = e.message || '共同メモへ追記できませんでした'; }
        finally { submit.disabled = false; }
      });
      return wrap;
    };

    if (pullButton) pullButton.addEventListener('click', pull);
    if (pushButton) pushButton.addEventListener('click', () => push());
    if (rememberInput) rememberInput.addEventListener('change', remember);
    if (authorInput) authorInput.addEventListener('change', rememberAuthor);
    if (tokenInput) tokenInput.addEventListener('change', () => {
      if (!token()) return;
      loadEntries();
      startEntryPolling();
    });
    if (store.subscribe) store.subscribe(key => {
      if (syncing || key.startsWith('ui:') || !token()) return;
      clearTimeout(pushTimer);
      pushTimer = setTimeout(() => push({ quiet:true }), 2200);
    });
    if (rememberedToken) {
      setTimeout(() => loadEntries({ quiet:true }), 0);
      startEntryPolling();
    }
    say(rememberedToken ? '同期キー保存済み · 入力後に自動保存します' : '同期キーを入力してください');
    return { configured:true, pull, push, loadEntries, appendEntry, entriesFor, mountAppend, author, stop(){ if (entryPollTimer) clearInterval(entryPollTimer); } };
  }

  function downloadJson(store, filename){
    downloadText(
      JSON.stringify(payload(store), null, 2),
      filename || store.eventKey + '-records-' + new Date().toISOString().slice(0,10) + '.json',
      'application/json;charset=utf-8'
    );
  }

  function downloadText(text, filename, mimeType){
    const content = String(text);
    const type = mimeType || 'text/plain;charset=utf-8';
    const canUseBlobUrl = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
    const url = canUseBlobUrl
      ? URL.createObjectURL(new Blob([content], { type }))
      : 'data:' + type + ',' + encodeURIComponent(content);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || 'trip-notes.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (canUseBlobUrl) setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function readJsonFile(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Unable to read JSON file'));
      reader.onload = () => {
        try {
          const value = JSON.parse(String(reader.result));
          if (!value || value.schema !== SCHEMA || value.version !== VERSION || !value.data) throw new Error('Unsupported JSON format');
          resolve(value);
        } catch(e) { reject(e); }
      };
      reader.readAsText(file);
    });
  }

  function fitTextarea(textarea){
    if (!textarea || (textarea.offsetHeight === 0 && !textarea.offsetParent)) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 52) + 'px';
  }

  function localTimestamp(date){
    const value = date || new Date();
    const pad = number => String(number).padStart(2, '0');
    const offset = -value.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absolute = Math.abs(offset);
    return '[' + value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate()) +
      ' ' + pad(value.getHours()) + ':' + pad(value.getMinutes()) +
      ' UTC' + sign + pad(Math.floor(absolute / 60)) + ':' + pad(absolute % 60) + ']';
  }

  function mountTimestampAppend(textarea, options){
    if (!textarea || textarea.dataset.tripTimestampMounted === '1') return null;
    textarea.dataset.tripTimestampMounted = '1';
    const row = document.createElement('div');
    row.className = 'trip-timestamp-row trip-no-print';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trip-timestamp-button';
    button.textContent = options && options.label || '＋ 時刻付きで追記';
    button.setAttribute('aria-label', options && options.ariaLabel || button.textContent);
    button.addEventListener('click', () => {
      const current = textarea.value.replace(/\s+$/, '');
      textarea.value = (current ? current + '\n' : '') + localTimestamp() + ' ';
      textarea.dispatchEvent(new Event('input', { bubbles:true }));
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      fitTextarea(textarea);
    });
    row.appendChild(button);
    textarea.insertAdjacentElement('afterend', row);
    return button;
  }

  function fieldValue(field){
    if (field.type === 'checkbox') return field.checked;
    return field.value;
  }

  function setFieldValue(field, value){
    if (field.type === 'checkbox') field.checked = Boolean(value);
    else field.value = value == null ? '' : String(value);
    if (field.tagName === 'TEXTAREA') fitTextarea(field);
  }

  function fieldLabel(field){
    if (field.dataset.tripLabel) return field.dataset.tripLabel;
    if (field.id) {
      const label = document.querySelector('label[for="' + CSS.escape(field.id) + '"]');
      if (label) return label.textContent.trim();
    }
    const wrapping = field.closest('label');
    return wrapping ? wrapping.textContent.trim() : field.dataset.tripStore;
  }

  function markdown(root, title){
    const lines = ['# ' + (title || document.title), ''];
    root.querySelectorAll('[data-trip-store]').forEach(field => {
      const value = fieldValue(field);
      if (value === '' || value === false || value == null) return;
      lines.push('- **' + fieldLabel(field) + '**：' + (value === true ? '完了' : String(value).trim()));
    });
    const seenEntries = new Set();
    root.querySelectorAll('.trip-shared-entry[data-trip-entry-id]').forEach(item => {
      if (seenEntries.has(item.dataset.tripEntryId)) return;
      seenEntries.add(item.dataset.tripEntryId);
      lines.push('- **共同メモ** ' + item.querySelector('.trip-shared-meta').textContent + '：' + item.querySelector('.trip-shared-text').textContent);
    });
    lines.push('');
    return lines.join('\n');
  }

  function copyText(text){
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); return Promise.resolve(); }
    catch(e) { return Promise.reject(e); }
    finally { textarea.remove(); }
  }

  function mount(options){
    const root = options && options.root || document;
    const body = root.body || document.body;
    const eventKey = options && options.eventKey || body.dataset.tripKey;
    const store = options && options.store || createStore(eventKey);
    const status = message => {
      const target = root.querySelector('[data-trip-status]');
      if (!target) return;
      target.textContent = message;
      setTimeout(() => { if (target.textContent === message) target.textContent = ''; }, 2600);
    };

    const showTab = name => {
      root.querySelectorAll('[data-trip-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.tripPanel === name));
      root.querySelectorAll('[data-trip-tab]').forEach(tab => {
        const active = tab.dataset.tripTab === name;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      store.set('ui:tab', name);
      root.querySelectorAll('[data-trip-panel].is-active textarea').forEach(fitTextarea);
    };
    root.querySelectorAll('[data-trip-tab]').forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tripTab)));

    const fields = Array.from(root.querySelectorAll('[data-trip-store]'));
    fields.forEach(field => {
      const key = field.dataset.tripStore;
      setFieldValue(field, store.get(key, field.type === 'checkbox' ? field.checked : field.value));
      const eventName = field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(eventName, () => {
        store.set(key, fieldValue(field));
        if (field.tagName === 'TEXTAREA') fitTextarea(field);
      });
    });
    const exportButton = root.querySelector('[data-trip-export-json]');
    if (exportButton) exportButton.addEventListener('click', () => {
      downloadJson(store, exportButton.dataset.filename);
      status('JSONを書き出しました');
    });

    const importInput = root.querySelector('[data-trip-import-json]');
    if (importInput) importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        const value = await readJsonFile(file);
        if (value.eventKey && value.eventKey !== store.eventKey) throw new Error('This JSON belongs to a different trip');
        store.restore(value.data);
        status('JSONを読み込みました');
        setTimeout(() => location.reload(), 500);
      } catch(e) { status('JSONを読み込めませんでした'); }
      finally { importInput.value = ''; }
    });

    const markdownButton = root.querySelector('[data-trip-export-markdown]');
    if (markdownButton) markdownButton.addEventListener('click', () => {
      copyText(markdown(root, markdownButton.dataset.title)).then(
        () => status('Markdownをコピーしました'),
        () => status('コピーできませんでした')
      );
    });

    const markdownDownloadButton = root.querySelector('[data-trip-download-markdown]');
    if (markdownDownloadButton) markdownDownloadButton.addEventListener('click', () => {
      const filename = markdownDownloadButton.dataset.filename || store.eventKey + '-notes-' + new Date().toISOString().slice(0,10) + '.md';
      downloadText(markdown(root, markdownDownloadButton.dataset.title), filename, 'text/markdown;charset=utf-8');
      status('Markdownをダウンロードしました');
    });

    const cloud = createCloudSync({
      root,
      store,
      endpoint:options && options.cloudEndpoint,
      status,
      onRestore(){
        fields.forEach(field => setFieldValue(field, store.get(field.dataset.tripStore, field.type === 'checkbox' ? false : '')));
      }
    });
    root.querySelectorAll('textarea[data-trip-append-timestamp]').forEach(field => {
      if (cloud && cloud.mountAppend) cloud.mountAppend(field, field.dataset.tripStore);
      else mountTimestampAppend(field);
    });

    const firstTab = root.querySelector('[data-trip-tab]');
    showTab(store.get('ui:tab', firstTab ? firstTab.dataset.tripTab : 'itinerary'));
    return { store, showTab, status, fields, cloud };
  }

  global.TripField = {
    schema:SCHEMA,
    version:VERSION,
    createStore,
    payload,
    downloadJson,
    downloadText,
    readJsonFile,
    fitTextarea,
    localTimestamp,
    mountTimestampAppend,
    markdown,
    createCloudSync,
    mount
  };
})(window);
