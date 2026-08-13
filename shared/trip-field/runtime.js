(function(global){
  'use strict';

  const SCHEMA = 'trip-field-records';
  const VERSION = 1;

  function createStore(eventKey){
    if (!eventKey) throw new Error('TripField requires an event key');
    const prefix = eventKey + ':';
    return {
      eventKey,
      get(key, fallback){
        try {
          const raw = localStorage.getItem(prefix + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch(e) { return fallback; }
      },
      set(key, value){
        try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true; }
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
      }
    };
  }

  function payload(store){
    return {
      schema: SCHEMA,
      version: VERSION,
      eventKey: store.eventKey,
      exportedAt: new Date().toISOString(),
      data: store.snapshot()
    };
  }

  function downloadJson(store, filename){
    const blob = new Blob([JSON.stringify(payload(store), null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || store.eventKey + '-records-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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

    const firstTab = root.querySelector('[data-trip-tab]');
    showTab(store.get('ui:tab', firstTab ? firstTab.dataset.tripTab : 'itinerary'));
    return { store, showTab, status, fields };
  }

  global.TripField = {
    schema:SCHEMA,
    version:VERSION,
    createStore,
    payload,
    downloadJson,
    readJsonFile,
    fitTextarea,
    markdown,
    mount
  };
})(window);
