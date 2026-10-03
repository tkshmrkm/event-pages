'use strict';
(() => {
  const KEY = 'event-pages:personal-inspection:murakami:v1';
  const FROM = '2026-10-03';
  const TO = '2027-12-31';
  const STATES = ['未検討', '候補あり', '仮決め', '確定', '当日判断'];
  const PARTICIPATION = ['参加予定', '検討中', '参加済み', '見送り'];
  const fields = ['participation', 'state', 'visitStart', 'visitEnd', 'goal', 'next', 'deadline', 'booking', 'checkedAt', 'memo'];
  const optionalFields = ['tripStart', 'tripEnd'];
  const context = window.PERSONAL_INSPECTION_CONTEXT || {seeds:[],groups:[],history:[],decisions:[],extraEvents:[],official:{}};
  const $ = id => document.getElementById(id);
  const allEvents = window.PHYSICAL_AI_EVENTS;
  if (!Array.isArray(allEvents)) {
    $('storageStatus').textContent = 'イベントデータを読み込めません。physical_ai_events.js を同じフォルダに置いてください。';
    return;
  }
  const events = [...allEvents.filter(e => e.dateStatus === 'confirmed' ? e.sortDate >= FROM && e.sortDate <= TO : /202[67]/.test(e.name)), ...context.extraEvents];
  const byId = new Map(events.map(e => [e.id, e]));
  const emptyPlan = () => ({
    participation: '参加予定', state: '未検討', tripStart:'', tripEnd:'', visitStart: '', visitEnd: '', goal: '', next: '', deadline: '', booking: '', checkedAt: '', memo: ''
  });
  const defaults = () => ({
    ...Object.fromEntries(events.filter(e => e.assignment.split(/[・、,／/\s]+/).includes('村上') && e.status === '参加予定').map(e => [e.id, emptyPlan()])),
    ...Object.fromEntries(context.seeds.filter(s=>byId.has(s.id)).map(({id,...seed})=>[id,{...emptyPlan(),participation:'検討中',state:'候補あり',...seed}]))
  });
  let plans = defaults();
  let storageWarning = false;
  function message(text) { $('storageStatus').textContent = text; }
  const validDate = value => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value);
  function validate(payload) {
    if (!payload || payload.schema !== 'personal-inspection-plan' || payload.version !== 1 || payload.person !== '村上' || !payload.plans || typeof payload.plans !== 'object' || Array.isArray(payload.plans)) throw new Error('村上の視察予定JSON（version 1）を選んでください');
    const result = {};
    for (const [id, plan] of Object.entries(payload.plans)) {
      if (!byId.has(id)) throw new Error('元データにないイベントIDが含まれています：' + id);
      if (!plan || typeof plan !== 'object' || !PARTICIPATION.includes(plan.participation) || !STATES.includes(plan.state)) throw new Error('参加区分または準備状態が不正です');
      if (fields.some(f => typeof plan[f] !== 'string' || plan[f].length > 10000)) throw new Error('項目が不足、または長すぎます');
      if (optionalFields.some(f=>plan[f] !== undefined && typeof plan[f] !== 'string')) throw new Error('本人提示期間の形式が不正です');
      if (['visitStart', 'visitEnd', 'deadline', 'checkedAt'].some(f => !validDate(plan[f]))) throw new Error('日付が不正です');
      if (plan.visitEnd && (!plan.visitStart || plan.visitEnd < plan.visitStart)) throw new Error('視察終了日は開始日以降にしてください');
      if (optionalFields.some(f=>!validDate(plan[f] || '')) || (plan.tripEnd && (!plan.tripStart || plan.tripEnd < plan.tripStart))) throw new Error('出張・滞在案の期間が不正です');
      result[id] = Object.fromEntries([...fields,...optionalFields.filter(f=>plan[f] !== undefined)].map(f => [f, plan[f]]));
    }
    return result;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) { const restored=validate(JSON.parse(saved)); for(const [id,p] of Object.entries(restored)) plans[id]={...emptyPlan(),...plans[id],...p}; }
    message('このブラウザーに自動保存 · JSONでもバックアップできます');
  } catch (error) {
    storageWarning = true;
    message('保存済みデータを読み込めません。既存データは上書きせず、JSON保存で持ち出せます：' + error.message);
  }
  function payload() { return {schema: 'personal-inspection-plan', version: 1, person: '村上', period: {from: FROM, to: TO}, providedContext:context, exportedAt: new Date().toISOString(), plans}; }
  function save() {
    if (storageWarning) { message('このブラウザーの保存が利用できません。JSONで保存してください'); return; }
    try { localStorage.setItem(KEY, JSON.stringify(payload())); message('このブラウザーに保存しました'); }
    catch { message('ブラウザー保存に失敗しました。画面の編集は残っています。JSONで保存してください'); }
  }
  function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
  function fact(dl, label, text) { dl.append(node('dt', label), node('dd', text)); }
  function range(start, end) { return start ? start + (end && end !== start ? ' – ' + end : '') : '未入力'; }
  function comparePlans([a,pa], [b,pb]) {
    return (pa.tripStart || pa.visitStart || byId.get(a).sortDate || '9999').localeCompare(pb.tripStart || pb.visitStart || byId.get(b).sortDate || '9999')
      || (byId.get(a).sortDate || '9999').localeCompare(byId.get(b).sortDate || '9999')
      || byId.get(a).name.localeCompare(byId.get(b).name, 'ja');
  }
  function editControl(id, plan, key, label, type = 'text', choices) {
    const wrap = node('label', label);
    const control = node(choices ? 'select' : type === 'textarea' ? 'textarea' : 'input');
    if (choices) choices.forEach(choice => { const option = node('option', choice); option.value = choice; control.append(option); });
    else if (type !== 'textarea') control.type = type;
    control.value = plan[key]; control.dataset.field = key;
    control.addEventListener('change', () => {
      const draft = {...plans[id], [key]: control.value};
      try { validate({schema: 'personal-inspection-plan', version: 1, person: '村上', plans: {[id]: draft}}); }
      catch (error) { control.setCustomValidity(error.message); control.reportValidity(); message(error.message); return; }
      control.setCustomValidity(''); plans[id] = draft; save();
      // Keep the open editor and keyboard focus while refreshing its summary.
      render(id, key);
    });
    control.addEventListener('input', () => {
      control.setCustomValidity('');
      const draft = {...plans[id], [key]: control.value};
      try { validate({schema:'personal-inspection-plan', version:1, person:'村上', plans:{[id]:draft}}); plans[id] = draft; save(); }
      catch { /* Wait for a complete, valid date before saving. */ }
    });
    wrap.append(control); if (type === 'textarea') wrap.className = 'wide'; return wrap;
  }
  function render(focusId, focusField) {
    const opened = new Set(Array.from(document.querySelectorAll('.event .plan-editor[open]')).map(d => d.closest('.event').dataset.id));
    const entries = Object.entries(plans).filter(([id]) => byId.has(id));
    $('plannedCount').textContent = entries.filter(([,p]) => p.participation === '参加予定').length;
    $('candidateCount').textContent = entries.filter(([,p]) => p.participation === '検討中').length;
    $('undatedCount').textContent = entries.filter(([,p]) => p.participation === '参加予定' && !p.visitStart).length;
    const filter = $('yearFilter').value;
    const visible = entries.filter(([id,p]) => filter === 'all' || (p.tripStart || p.visitStart || byId.get(id).sortDate || byId.get(id).name.match(/202[67]/)?.[0] || '').startsWith(filter));
    visible.sort(comparePlans);
    $('schedule').replaceChildren(); let lastMonth;
    visible.forEach(([id, plan]) => {
      const event = byId.get(id); const official=context.official[id]; const month = (plan.tripStart || plan.visitStart || event.sortDate || '').slice(0,7) || '日程未定';
      if (month !== lastMonth) { $('schedule').append(node('h3', month, 'month-heading')); lastMonth = month; }
      const card = node('article', undefined, 'event'); card.dataset.id = id; card.dataset.participation = plan.participation;
      const top = node('div', undefined, 'event-top');
      top.append(node('span', plan.participation, 'badge ' + (plan.participation === '参加予定' ? 'planned' : 'candidate')), node('span', '準備：' + plan.state, 'badge'));
      card.append(top, node('h3', event.name));
      const dl = node('dl', undefined, 'facts');
      fact(dl, '開催期間', official ? official.label : event.dateStatus === 'confirmed' ? event.year + '年 ' + event.dateLabel + '（元資料）' : event.handling || '未発表');
      fact(dl, '出張・滞在案', range(plan.tripStart, plan.tripEnd));
      fact(dl, '現地の視察日', range(plan.visitStart, plan.visitEnd)); fact(dl, '開催地', official?.location || event.location);
      if (official) fact(dl,'公式確認日',context.providedAt); else if (event.verifiedAt) fact(dl, '元資料確認日', event.verifiedAt);
      fact(dl, '本人確認日', plan.checkedAt || '未入力');
      if (plan.booking) fact(dl, '予約状況', plan.booking);
      if (plan.deadline) fact(dl, '判断期限', plan.deadline);
      card.append(dl, node('p', '狙い：' + (plan.goal || '未入力'), 'goal'), node('p', '次に決めること：' + (plan.next || '未入力'), 'next goal'));
      if (plan.memo) card.append(node('p', 'メモ：' + plan.memo, 'goal'));
      if (official) { const source=node('details',undefined,'official-source'); source.append(node('summary','公式日程の出典・留保（2026-10-03確認）')); if(official.note) source.append(node('p',official.note,'source-note')); const links=node('p',undefined,'sources'); official.sources.forEach(([title,url])=>{const a=node('a',title);a.href=url;links.append(a);});source.append(links);card.append(source); }
      if (id === '20261019-techex-europe-2026' || id === '20261020-euroblech-2026') { const link = node('a', '欧州出張の詳細旅程'); link.href = '202610_Europe_TechEx_EuroBLECH/'; card.append(link); }
      const details = node('details',undefined,'plan-editor'); details.open = opened.has(id); details.append(node('summary', '期間・視察日・狙い・準備を編集'));
      const grid = node('div', undefined, 'edit-grid');
      grid.append(editControl(id, plan, 'participation', '本人の参加区分', 'text', PARTICIPATION), editControl(id, plan, 'state', '準備の状態', 'text', STATES), editControl(id, plan, 'visitStart', '視察開始日', 'date'), editControl(id, plan, 'visitEnd', '視察終了日', 'date'), editControl(id, plan, 'goal', '視察の狙い・質問', 'textarea'), editControl(id, plan, 'next', '次に決めること・確定条件', 'textarea'), editControl(id, plan, 'deadline', '判断期限', 'date'), editControl(id, plan, 'booking', '予約状況'), editControl(id, plan, 'checkedAt', '本人による最終確認日', 'date'), editControl(id, plan, 'memo', 'メモ', 'textarea'));
      grid.prepend(editControl(id,plan,'tripStart','出張・滞在案の開始日','date'),editControl(id,plan,'tripEnd','出張・滞在案の終了日','date'));
      details.append(grid); card.append(details);
      const source = node('details'); source.append(node('summary', '全体計画での位置づけ'), node('p', '参加状況：' + (event.status || event.handling) + ' / 担当：' + event.assignment), node('p', event.purpose)); card.append(source);
      $('schedule').append(card);
    });
    if (!visible.length) $('schedule').append(node('p', 'この年の個人予定はありません。候補から追加できます。', 'empty'));
    if (focusId && focusField) {
      const card = Array.from(document.querySelectorAll('.event')).find(c => c.dataset.id === focusId);
      card?.querySelector('[data-field="' + focusField + '"]')?.focus({preventScroll:true});
    }
    fillPicker();
  }
  function fillPicker() {
    const old = $('eventPicker').value; const query = $('candidateSearch').value.trim().toLowerCase();
    const choices = events.filter(e => !Object.hasOwn(plans, e.id) && (e.name + ' ' + e.location).toLowerCase().includes(query)).sort((a,b) => (a.sortDate || '9999').localeCompare(b.sortDate || '9999'));
    $('eventPicker').replaceChildren();
    choices.forEach(e => { const option = node('option', (e.sortDate || '日程未定') + ' · ' + e.name); option.value = e.id; $('eventPicker').append(option); });
    if (choices.some(e => e.id === old)) $('eventPicker').value = old;
    $('addEvent').disabled = !choices.length; preview();
  }
  function preview() { const e = byId.get($('eventPicker').value); $('candidatePreview').textContent = e ? e.location + ' / 全体計画：' + (e.status || e.handling) + ' / 担当：' + e.assignment : '追加できる候補がありません'; }
  $('candidateSearch').addEventListener('input', fillPicker); $('eventPicker').addEventListener('change', preview);
  $('yearFilter').addEventListener('change', () => render());
  $('addEvent').addEventListener('click', () => { const id = $('eventPicker').value; if (!byId.has(id) || Object.hasOwn(plans, id)) return; plans[id] = {...emptyPlan(), participation:'検討中', state:'候補あり'}; save(); render(); });
  let downloadUrl;
  function download(text, ext, mime) {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([text], {type:mime}));
    const a = node('a', ext.toUpperCase() + 'ファイルをダウンロード'); a.href = downloadUrl; a.download = 'murakami-inspection-plan.' + ext;
    $('downloadLink').replaceChildren(a); a.click();
    $('exportFallback').hidden = false; $('exportText').value = text;
    message('書き出しファイルを生成しました。保存が始まらない場合は上のダウンロードリンクを押してください');
  }
  // Blur commits an active editor before its values are exported.
  $('exportJson').addEventListener('click', () => { document.activeElement?.blur(); download(JSON.stringify(payload(), null, 2), 'json', 'application/json'); });
  $('exportMarkdown').addEventListener('click', () => {
    document.activeElement?.blur();
    const lines = ['# 村上の視察予定', '', '対象：2026-10-03〜2027-12-31', '開催情報：既存の全体俯瞰データと2026-10-03の公式確認。個人予定・参加履歴は本人提示。', ''];
    context.groups.forEach(g=>lines.push('## 本人提示案：'+g.title,'',g.period+' / '+g.place+' / '+g.label,g.note,''));
    context.decisions.forEach(d=>lines.push('## 検討事項：'+d.title,'',d.text,'次に決めること：'+d.next,''));
    Object.entries(plans).sort(comparePlans).forEach(([id,p]) => { const e = byId.get(id), official=context.official[id]; lines.push('## ' + e.name, '', ...[['参加区分',p.participation],['準備',p.state],['開催期間',official?.label || e.dateLabel || e.handling],['出張・滞在案',range(p.tripStart,p.tripEnd)],['現地の視察日',range(p.visitStart,p.visitEnd)],['開催地',official?.location || e.location],['狙い・質問',p.goal],['次に決めること',p.next],['判断期限',p.deadline],['予約状況',p.booking],['本人確認日',p.checkedAt],['メモ',p.memo]].map(([k,v]) => '- ' + k + '：' + (v || '未入力')), ''); if(official) lines.push('公式確認：'+context.providedAt, official.note || '', ...official.sources.map(([t,u])=>'['+t+']('+u+')'),''); });
    lines.push('## 本人提示の過去参加履歴','','月・名称は本人提示のまま。2026-10は基準日より先で実績化未確認。',...context.history.map(([m,n])=>'- '+m+'：'+n));
    download(lines.join('\n'), 'md', 'text/markdown;charset=utf-8');
  });
  $('importJson').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 2000000) throw new Error('JSONは2MB以下にしてください'); const imported = validate(JSON.parse(await file.text())); for(const [id,p] of Object.entries(imported)) plans[id]={...emptyPlan(),...plans[id],...p}; render(); save(); }
    catch (error) { message('読込できません。現在の予定は保持しています：' + error.message); }
    event.target.value = '';
  });
  $('printPlan').addEventListener('click', () => { document.activeElement?.blur(); window.print(); });
  context.groups.forEach(g=>{const tr=node('tr');const title=node('td'); title.append(node('strong',g.title),node('p',g.label,'muted')); tr.append(title,node('td',g.period),node('td',g.place),node('td',g.note)); $('outline').append(tr);});
  context.decisions.forEach(d=>{const card=node('article',undefined,'decision');card.append(node('h3',d.title),node('p',d.text),node('p','次に決めること：'+d.next,'next'));$('decisions').append(card);});
  context.history.forEach(([month,name])=>{const tr=node('tr');const future=month>=FROM.slice(0,7);if(future)tr.className='history-future';tr.append(node('td',month),node('td',name),node('td',future?'本人提示の履歴／実績化未確認':'本人提示の参加履歴'));$('history').append(tr);});
  render();
})();
