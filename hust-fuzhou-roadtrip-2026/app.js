/* 下一程: independent plans, immutable National Day archive, and browser-local persistence. */
(() => {
  'use strict';
  const C = window.TripCore;
  const LIBRARY_KEY = 'roadtrip-library-v3';
  const ARCHIVE_KEY = 'roadtrip-national-day-archive-v3';
  const SETTINGS_KEY = 'roadtrip-amap-settings-v3';
  const LEGACY_KEY = 'hust-fuzhou-roadtrip-planner-v2';
  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const duration = value => { const minutes = Math.round(value); return minutes >= 60 ? `${Math.floor(minutes / 60)}小时${minutes % 60 ? `${minutes % 60}分` : ''}` : `${minutes}分钟`; };
  const formatTime = value => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
  const today = () => C.stamp(new Date()).slice(0, 10);
  const readJSON = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  let startupError = '';
  let legacy = readJSON(LEGACY_KEY);
  if (!legacy?.inbound || !Array.isArray(legacy.tripDays)) legacy = window.NATIONAL_DAY_DATA;
  let archive = readJSON(ARCHIVE_KEY);
  if (!archive || archive.id !== 'national-day-2026' || !Array.isArray(archive.days) || !archive.days.length) {
    archive = C.migrateLegacy(legacy);
    try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive)); } catch (_) { startupError = '浏览器暂不能保存数据，请导出行程文件备份。'; }
  }
  archive.readonly = true;
  const archiveSnapshot = JSON.stringify(archive);
  let library = readJSON(LIBRARY_KEY);
  if (!library || library.version !== 3 || !Array.isArray(library.plans)) {
    const copy = C.duplicatePlan(archive);
    copy.name = '国庆行程 · 可编辑副本';
    library = { version: 3, activeId: copy.id, plans: [copy] };
  }
  // The archive has its own storage record and is never written by normal editing.
  library.plans = library.plans.filter(plan => plan.id !== 'national-day-2026' && Array.isArray(plan.days) && plan.days.length);
  let settings = readJSON(SETTINGS_KEY) || { key: legacy.amap?.key || '', securityCode: legacy.amap?.securityCode || '', auto: true };
  let activeId = location.hash === '#national-day-2026' ? 'national-day-2026' : library.activeId;
  if (activeId !== archive.id && !library.plans.some(plan => plan.id === activeId)) activeId = archive.id;
  let storageError = false;
  let amapPromise = null;
  let amapSignature = '';
  const routeJobs = new Map();
  const routeStates = new Map();
  const routeQueue = new Map();
  let queueTimer;
  let liveSaveTimer;
  const currentPlan = () => activeId === archive.id ? archive : library.plans.find(plan => plan.id === activeId);
  const findDay = (plan, dayId) => plan?.days.find(day => day.id === dayId);
  const routeStateKey = (plan, day, stop) => `${plan.id}/${day.id}/${stop.id}`;
  function notice(text, error = false) { $('notice').textContent = text; $('notice').classList.toggle('error', error); $('notice').hidden = !text; }
  function persist() {
    library.activeId = activeId;
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); storageError = false; }
    catch (_) { storageError = true; notice('保存失败：浏览器存储不可用或空间不足，请导出行程文件备份。', true); }
    updateSaveStatus();
  }
  function record(label, plan = currentPlan()) {
    C.assertEditable(plan);
    plan.updatedAt = new Date().toISOString();
    plan.history = [...(plan.history || []), { at: plan.updatedAt, label }].slice(-100);
    persist();
    if (plan.id === activeId) renderHistory();
  }
  function updateSaveStatus() {
    const plan = currentPlan();
    $('save-status').textContent = storageError ? '未能保存' : plan.readonly ? '国庆存档 · 已锁定' : plan.updatedAt ? `已保存 ${formatTime(plan.updatedAt).split(' ').at(-1)}` : '自动保存已开启';
  }
  function renderHistory() {
    const history = currentPlan().history || [];
    $('history-list').innerHTML = history.length ? history.slice(-20).reverse().map(item => `<li><time>${safe(formatTime(item.at))}</time><span>${safe(item.label)}</span></li>`).join('') : '<li>这份行程还没有修改记录。</li>';
  }
  function renderOverview() {
    const plan = currentPlan();
    $('plan-title').textContent = plan.name;
    const dates = plan.days.map(day => day.date).sort();
    const totalKm = plan.days.reduce((sum, day) => sum + C.compute(day).km, 0);
    $('plan-subtitle').textContent = `${dates[0]} — ${dates.at(-1)} · ${plan.days.length}天 · ${plan.days.reduce((sum, day) => sum + day.stops.length, 0)}个目的地 · ${totalKm.toFixed(1)}公里`;
    document.title = `${plan.name}｜下一程`;
    $('plan-label').textContent = plan.readonly ? 'NATIONAL DAY / 国庆独立存档' : 'YOUR ITINERARY / 自由编辑行程';
    $('plan-list').innerHTML = [archive, ...library.plans].map(item => `<button class="plan-choice ${item.id === activeId ? 'active' : ''}" data-action="select-plan" data-plan="${safe(item.id)}" aria-current="${item.id === activeId ? 'true' : 'false'}"><strong>${safe(item.name)}</strong><small>${safe(item.days[0]?.date)} · ${item.days.length}天</small>${item.readonly ? '<span class="lock">只读存档 · 不会覆盖</span>' : ''}</button>`).join('');
    updateSaveStatus();
  }
  function field(label, property, value, attrs = '', scope = 'day', ids = '', disabled = false, className = '') {
    return `<label class="${className}">${safe(label)}<input data-${scope}-field="${property}" ${ids} value="${safe(value)}" ${attrs} ${disabled ? 'disabled' : ''}></label>`;
  }
  const options = (choices, selected) => [...new Set([...choices, selected])].map(value => `<option value="${safe(value)}" ${value === selected ? 'selected' : ''}>${safe(value)}</option>`).join('');
  function stopCard(plan, day, stop, index) {
    const disabled = plan.readonly ? 'disabled' : '';
    const ids = `data-day="${safe(day.id)}" data-stop="${safe(stop.id)}"`;
    const state = routeStates.get(routeStateKey(plan, day, stop));
    const source = state?.status || stop.routeSource || 'manual';
    const badgeText = ({ manual: '手动 / 计划值', amap: '高德已更新', stale: '地点或顺序已改 · 待重算', loading: '高德计算中…', error: '算路失败 · 已保留原值' })[source];
    return `<article class="stop" id="stop-${safe(stop.id)}"><div class="stop-head"><input data-stop-field="name" ${ids} type="text" maxlength="200" placeholder="输入目的地名称" value="${safe(stop.name)}" aria-label="第${index + 1}站目的地名称" ${disabled}><div class="mini-actions">${!plan.readonly ? `<button data-action="move-stop" ${ids} data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑ 上移</button><button data-action="move-stop" ${ids} data-direction="1" ${index === day.stops.length - 1 ? 'disabled' : ''}>↓ 下移</button><button class="danger" data-action="delete-stop" ${ids}>删除</button>` : ''}</div></div>
      <div class="fields stop-fields"><label>地点类型<select data-stop-field="type" ${ids} ${disabled}>${options(['景点', '美食', '补给', '充电', '闪充', '住宿', '入住', '到达', '公交船', '停车', '夜景', '其他'], stop.type)}</select></label><label>上一站到这里<select data-stop-field="mode" ${ids} ${disabled}><option value="driving" ${stop.mode === 'driving' ? 'selected' : ''}>驾车</option><option value="walking" ${stop.mode === 'walking' ? 'selected' : ''}>步行</option><option value="none" ${stop.mode === 'none' ? 'selected' : ''}>无转场 / 原地</option></select></label>
      ${field('路程（公里）', 'km', stop.km, 'type="number" min="0" max="100000" step="0.1" inputmode="decimal"', 'stop', ids, plan.readonly)}
      ${field('路上时间（分钟）', 'drive', Math.round(stop.drive * 100) / 100, 'type="number" min="0" max="10080" step="any" inputmode="decimal"', 'stop', ids, plan.readonly)}
      ${field('停留（分钟）', 'stay', stop.stay, 'type="number" min="0" max="10080" step="1" inputmode="numeric"', 'stop', ids, plan.readonly)}
      ${field('最早游览时间（可选）', 'minTime', stop.minTime, 'type="time"', 'stop', ids, plan.readonly)}
      <label class="wide">移到另一天<select data-stop-field="moveTo" ${ids} ${disabled}>${plan.days.map((item, i) => `<option value="${safe(item.id)}" ${item.id === day.id ? 'selected' : ''}>第${i + 1}天 · ${safe(item.date)}</option>`).join('')}</select></label>
      <label class="span2">备注 / 酒店 / 小吃 / 停车提示<textarea data-stop-field="hint" ${ids} maxlength="3000" rows="2" ${disabled}>${safe(stop.hint)}</textarea></label></div>
      <div class="route-row"><span class="route-badge ${safe(source)}">${safe(badgeText)}${stop.routeUpdatedAt && source === 'amap' ? ` · ${safe(formatTime(stop.routeUpdatedAt))}` : ''}</span><span>${!plan.readonly ? `<button data-action="route-stop" ${ids} ${stop.mode === 'none' ? 'disabled' : ''}>高德重算</button>` : ''} <a href="https://www.amap.com/search?query=${encodeURIComponent(stop.name)}" target="_blank" rel="noopener">高德位置 ↗</a></span></div>
      <div class="matched">${state?.message ? safe(state.message) : stop.matchedDestination ? safe(`高德匹配：${stop.matchedOrigin} → ${stop.matchedDestination}`) : '出发地与目的地请尽量写明城市、店名或地址。'}</div>
      <div class="times" data-stop-times="${safe(stop.id)}"></div><div class="wait" data-stop-wait="${safe(stop.id)}"></div></article>`;
  }
  function render(preserveFocus = false) {
    const focused = document.activeElement;
    const focusData = preserveFocus && focused?.matches('[data-plan-field], [data-day-field], [data-stop-field]') ? {
      dataset: { ...focused.dataset }, value: focused.value, start: focused.selectionStart, end: focused.selectionEnd
    } : null;
    const plan = currentPlan();
    const disabled = plan.readonly ? 'disabled' : '';
    renderOverview();
    $('archive-notice').hidden = !plan.readonly;
    $('delete-plan').hidden = plan.readonly;
    $('add-day').hidden = plan.readonly;
    $('plan-settings').innerHTML = `<h3>行程设置</h3><div class="fields">${field('行程名称', 'name', plan.name, 'type="text" maxlength="100"', 'plan', '', plan.readonly, 'span2')}${field('开始日期（整体平移所有日期）', 'startDate', plan.days[0].date, 'type="date"', 'plan', '', plan.readonly)}${field('旅行天数', 'count', plan.days.length, 'type="number" min="1" max="90" step="1"', 'plan', '', plan.readonly)}<label class="span2">行程简介 / 旅行备忘<textarea data-plan-field="description" maxlength="3000" ${disabled}>${safe(plan.description)}</textarea></label></div>`;
    $('day-nav').innerHTML = plan.days.map((day, index) => `<a href="#day-${safe(day.id)}">第${index + 1}天 · ${safe(day.date.slice(5))}</a>`).join('');
    $('days').innerHTML = plan.days.map((day, index) => {
      const ids = `data-day="${safe(day.id)}"`;
      return `<section class="day" id="day-${safe(day.id)}" aria-label="第${index + 1}天行程"><div class="day-header"><div class="day-top"><h3><b>DAY ${String(index + 1).padStart(2, '0')}</b> ${safe(day.date)}</h3><div class="mini-actions">${!plan.readonly ? `<button data-action="route-day" ${ids}>高德重算本日</button><button class="danger" data-action="delete-day" ${ids} ${plan.days.length <= 1 ? 'disabled' : ''}>删除这天</button>` : ''}</div></div><div class="fields day-fields">
      ${field('这天的日期', 'date', day.date, 'type="date"', 'day', ids, plan.readonly)}${field('当天出发时间', 'start', day.start, 'type="time"', 'day', ids, plan.readonly)}${field('出发地', 'origin', day.origin, 'type="text" maxlength="200" placeholder="城市 / 酒店 / 具体地址"', 'day', ids, plan.readonly, 'wide')}${field('当天标题', 'title', day.title, 'type="text" maxlength="200" placeholder="例如：湖边散步 → 老街小吃"', 'day', ids, plan.readonly, 'wide')}<label class="wide">当天备注<textarea data-day-field="notes" ${ids} maxlength="3000" rows="1" ${disabled}>${safe(day.notes)}</textarea></label></div><div class="day-summary" data-day-summary="${safe(day.id)}"></div><div class="day-warning" data-day-warning="${safe(day.id)}"></div></div><div class="stops">${day.stops.length ? day.stops.map((stop, i) => stopCard(plan, day, stop, i)).join('') : '<div class="empty-day">还没安排目的地。点击下方按钮，加入今天想去的地方。</div>'}</div>${!plan.readonly ? `<button class="add-stop" data-action="add-stop" ${ids}>＋ 添加目的地</button>` : ''}</section>`;
    }).join('');
    updateSchedules(); renderHistory();
    // Route requests may finish while another field is being edited.
    // Keep that field's draft and caret instead of replacing it with older UI text.
    if (focusData) {
      const selector = Object.entries(focusData.dataset).map(([key, value]) => `[data-${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}="${CSS.escape(value)}"]`).join('');
      const replacement = document.querySelector(selector);
      if (replacement && !replacement.disabled) {
        replacement.value = focusData.value;
        replacement.focus({ preventScroll: true });
        if (typeof focusData.start === 'number') replacement.setSelectionRange(focusData.start, focusData.end);
      }
    }
  }
  function updateSchedules() {
    const plan = currentPlan();
    plan.days.forEach((day, index) => {
      const info = C.compute(day);
      const summary = document.querySelector(`[data-day-summary="${day.id}"]`);
      if (summary) summary.innerHTML = `<span>出发 <strong>${safe(day.start)}</strong></span><span>路上 <strong>${duration(info.travel)}</strong></span><span>停留 <strong>${duration(info.stay)}</strong></span><span>里程 <strong>${info.km.toFixed(1)} km</strong></span><span>预计结束 <strong>${safe(C.stamp(info.end))}</strong></span>`;
      info.stops.forEach(stop => {
        const times = document.querySelector(`[data-stop-times="${stop.id}"]`);
        if (times) times.innerHTML = `<span>抵达 <strong>${safe(C.stamp(stop.arrival))}</strong></span><span>离开 <strong>${safe(C.stamp(stop.depart))}</strong></span>`;
        const wait = document.querySelector(`[data-stop-wait="${stop.id}"]`);
        if (wait) wait.textContent = stop.wait ? `等到 ${stop.minTime} 开始游览 · 自动等待 ${duration(stop.wait)}` : '';
      });
      const warnings = [];
      if (C.stamp(info.end).slice(0, 10) !== day.date) warnings.push('当天行程已跨到次日。');
      const next = plan.days[index + 1];
      if (next && info.end >= new Date(`${next.date}T${next.start}:00+08:00`)) warnings.push('结束时间与下一天出发时间重叠，请调整日期、出发时间或停留。');
      const warning = document.querySelector(`[data-day-warning="${day.id}"]`);
      if (warning) warning.textContent = warnings.join(' ');
    });
    renderOverview();
  }
  function scheduleRoute(day, stops) {
    if (!settings.auto || !settings.key || !settings.securityCode || currentPlan().readonly) return;
    const plan = currentPlan();
    stops.filter(Boolean).forEach(stop => routeQueue.set(routeStateKey(plan, day, stop), { planId: plan.id, dayId: day.id, stopId: stop.id }));
    clearTimeout(queueTimer);
    queueTimer = setTimeout(async () => {
      const jobs = [...routeQueue.values()]; routeQueue.clear();
      for (const job of jobs) await updateRoute(job.planId, job.dayId, job.stopId);
    }, 500);
  }
  function markRouteChanges(day) {
    C.invalidateRoutes(day);
    day.stops.forEach((stop, index) => {
      const key = routeStateKey(currentPlan(), day, stop);
      const state = routeStates.get(key);
      if (state?.fingerprint && state.fingerprint !== C.routeKey(day, index)) {
        routeStates.delete(key); routeJobs.delete(key);
      }
      if (stop.routeSource !== 'amap') { stop.matchedOrigin = ''; stop.matchedDestination = ''; }
    });
  }
  document.addEventListener('input', event => {
    const input = event.target;
    const textProperty = input.dataset.planField || input.dataset.dayField || input.dataset.stopField;
    if (textProperty && (input.type === 'text' || input.tagName === 'TEXTAREA')) {
      const plan = currentPlan(); if (plan.readonly) return;
      const day = findDay(plan, input.dataset.day);
      const target = input.dataset.planField ? plan : input.dataset.dayField ? day : day?.stops.find(item => item.id === input.dataset.stop);
      if (target) {
        target[textProperty] = input.value;
        if (day && ['origin', 'name'].includes(textProperty)) markRouteChanges(day);
        plan.updatedAt = new Date().toISOString(); persist();
      }
      return;
    }
    if (!input.dataset.stopField || !['drive', 'km', 'stay'].includes(input.dataset.stopField)) return;
    const plan = currentPlan(); if (plan.readonly) return;
    const day = findDay(plan, input.dataset.day), stop = day?.stops.find(item => item.id === input.dataset.stop);
    if (!stop || !input.checkValidity()) return;
    stop[input.dataset.stopField] = C.number(input.value, input.dataset.stopField === 'km' ? 100000 : 10080);
    if (input.dataset.stopField !== 'stay') { stop.routeSource = 'manual'; routeJobs.delete(routeStateKey(plan, day, stop)); routeStates.delete(routeStateKey(plan, day, stop)); }
    updateSchedules();
    // Persist immediately, so leaving the page during editing does not lose times.
    plan.updatedAt = new Date().toISOString(); persist();
    clearTimeout(liveSaveTimer);
    liveSaveTimer = setTimeout(() => { if (library.plans.includes(plan)) record('更新路程或停留时间', plan); }, 500);
  });
  document.addEventListener('change', event => {
    const input = event.target;
    const plan = currentPlan();
    if (input.id === 'amap-auto') { settings.auto = input.checked; saveSettings(); return; }
    if (!(input.dataset.planField || input.dataset.dayField || input.dataset.stopField)) return;
    if (plan.readonly) { render(); return; }
    try {
      if (input.dataset.planField) {
        const property = input.dataset.planField;
        if (property === 'startDate') C.setStartDate(plan, input.value);
        else if (property === 'count') {
          const count = Number(input.value);
          if (count < plan.days.length && !confirm(`减少到${count}天会移除后面的日期及目的地。国庆存档不受影响。继续吗？`)) { render(); return; }
          C.resizeDays(plan, count);
        } else plan[property] = input.value.trim() || (property === 'name' ? '我的旅行' : '');
        record('修改行程设置'); render(); return;
      }
      const day = findDay(plan, input.dataset.day); if (!day) return;
      if (input.dataset.dayField) {
        const property = input.dataset.dayField;
        if ((property === 'date' && !C.dateValid(input.value)) || (property === 'start' && !C.timeValid(input.value))) { render(); return; }
        day[property] = input.value.trim();
        if (property === 'origin') { markRouteChanges(day); scheduleRoute(day, [day.stops[0]]); }
        record('修改当天日期、出发地或安排'); render(); return;
      }
      const stop = day.stops.find(item => item.id === input.dataset.stop); if (!stop) return;
      const property = input.dataset.stopField;
      if (['drive', 'km', 'stay'].includes(property)) { render(); return; }
      if (property === 'moveTo') {
        const target = findDay(plan, input.value); if (!target || target === day) return;
        day.stops.splice(day.stops.indexOf(stop), 1); target.stops.push(stop);
        markRouteChanges(day); markRouteChanges(target); scheduleRoute(day, day.stops); scheduleRoute(target, [stop]);
        record(`将“${stop.name || '目的地'}”移到${target.date}`); render(); return;
      }
      stop[property] = input.value.trim();
      if (property === 'name' || property === 'mode') {
        if (stop.mode === 'none') { stop.drive = 0; stop.km = 0; stop.routeSource = 'manual'; }
        markRouteChanges(day);
        const index = day.stops.indexOf(stop);
        scheduleRoute(day, [stop, day.stops[index + 1]]);
      }
      record(`修改目的地：${stop.name || '未命名'}`); render();
    } catch (error) { notice(error.message, true); render(); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('input[type="text"]')) { event.preventDefault(); event.target.blur(); }
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    if (action === 'select-plan') { activeId = button.dataset.plan; persist(); notice(''); render(); return; }
    const plan = currentPlan(); if (plan.readonly) return;
    const day = findDay(plan, button.dataset.day); if (!day) return;
    const index = day.stops.findIndex(item => item.id === button.dataset.stop), stop = day.stops[index];
    if (action === 'add-stop') {
      const added = C.newStop(); day.stops.push(added); record('添加目的地'); render();
      document.querySelector(`[data-stop="${added.id}"][data-stop-field="name"]`)?.focus();
    } else if (action === 'delete-stop' && stop) {
      if (!confirm(`删除“${stop.name || '未命名目的地'}”？`)) return;
      day.stops.splice(index, 1); routeJobs.delete(routeStateKey(plan, day, stop));
      markRouteChanges(day); scheduleRoute(day, [day.stops[index]]); record(`删除目的地：${stop.name}`); render();
    } else if (action === 'move-stop' && stop) {
      const next = index + Number(button.dataset.direction); if (next < 0 || next >= day.stops.length) return;
      day.stops.splice(index, 1); day.stops.splice(next, 0, stop);
      markRouteChanges(day); scheduleRoute(day, day.stops.slice(Math.min(next, index), Math.max(next, index) + 2)); record('调整目的地顺序'); render();
    } else if (action === 'delete-day') {
      if (plan.days.length <= 1 || !confirm(`删除${day.date}这天的全部安排？`)) return;
      plan.days.splice(plan.days.indexOf(day), 1); record('删除一天'); render();
    } else if (action === 'route-stop' && stop) await updateRoute(plan.id, day.id, stop.id);
    else if (action === 'route-day') {
      for (const item of [...day.stops]) { if (!library.plans.includes(plan)) break; await updateRoute(plan.id, day.id, item.id); }
    }
  });
  $('new-plan').addEventListener('click', () => {
    const form = $('new-plan-form'); form.reset(); form.elements.date.value = today(); $('new-plan-dialog').showModal(); form.elements.name.focus();
  });
  $('cancel-new').addEventListener('click', () => $('new-plan-dialog').close());
  $('new-plan-form').addEventListener('submit', event => {
    event.preventDefault(); const form = event.target;
    const date = form.elements.date.value, count = Number(form.elements.count.value);
    if (!C.dateValid(date) || !Number.isInteger(count) || count < 1 || count > 90) return;
    const plan = C.createPlan(form.elements.name.value.trim(), date, count, form.elements.origin.value.trim());
    library.plans.push(plan); activeId = plan.id; record('创建旅行计划'); $('new-plan-dialog').close(); notice('新行程已创建，可以编辑每一天的出发地和目的地。'); render();
  });
  $('copy-plan').addEventListener('click', () => { const copy = C.duplicatePlan(currentPlan()); library.plans.push(copy); activeId = copy.id; record('复制行程'); notice('已建立独立副本，原行程保持原样。'); render(); });
  $('delete-plan').addEventListener('click', () => {
    const plan = currentPlan(); if (plan.readonly || !confirm(`删除整份“${plan.name}”？其他行程和国庆存档不受影响。`)) return;
    library.plans = library.plans.filter(item => item.id !== plan.id); activeId = library.plans[0]?.id || archive.id; persist(); notice('已删除这份行程。'); render();
  });
  $('add-day').addEventListener('click', () => {
    const plan = currentPlan(); if (plan.readonly) return;
    try { C.resizeDays(plan, plan.days.length + 1); record('新增一天'); render(); } catch (error) { notice(error.message, true); }
  });
  function download(name, content) {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('export-json').addEventListener('click', () => {
    const plan = C.clone(currentPlan());
    download(`${plan.name.replace(/[\\/:*?"<>|]/g, '_')}.json`, JSON.stringify({ format: 'next-journey', version: 3, plan }, null, 2));
    notice('已导出当前行程文件，可在其他设备导入。文件不包含高德密钥。');
  });
  $('import-plan').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('请导入5MB以内的行程文件。');
      const data = JSON.parse(await file.text());
      const plan = C.normalizePlan(data.plan || data); library.plans.push(plan); activeId = plan.id; record('导入行程文件'); notice('已作为新的可编辑行程导入，已有计划与国庆存档保持原样。'); render();
    } catch (error) { notice(error.message || '导入失败，请选择导出的行程JSON文件。', true); }
    event.target.value = '';
  });
  function printHTML(plan) {
    return `<header class="print-header"><h1>${safe(plan.name)}</h1><p>${safe(plan.description).replace(/\n/g, '<br>')}</p><p>${plan.days.length}天 · ${safe(plan.days[0].date)}起 · 北京时间</p></header>${plan.days.map((day, index) => {
      const info = C.compute(day);
      return `<section class="print-day"><h2>第${index + 1}天 · ${safe(day.date)} ${safe(day.title)}</h2><p>${safe(day.origin)} · ${safe(day.start)}出发</p><p class="print-note">${safe(day.notes).replace(/\n/g, '<br>')}</p><table><thead><tr><th>目的地</th><th>路程 / 路上</th><th>抵达</th><th>停留</th><th>离开</th></tr></thead><tbody>${info.stops.map(stop => `<tr><td>${safe(stop.name)}<br><span class="print-note">${safe(stop.type)} · ${safe(stop.hint)}</span></td><td>${stop.mode === 'none' ? '无转场' : `${stop.km.toFixed(1)}km / ${duration(stop.drive)}`}<br><span class="print-note">${stop.routeSource === 'amap' ? '高德已更新' : stop.routeSource === 'stale' ? '待重算' : '计划值'}</span></td><td>${safe(C.stamp(stop.arrival))}</td><td>${duration(stop.stay)}${stop.wait ? `<br>等待${duration(stop.wait)}` : ''}</td><td>${safe(C.stamp(stop.depart))}</td></tr>`).join('')}</tbody></table><p class="print-note">路上${duration(info.travel)} · 停留${duration(info.stay)} · ${info.km.toFixed(1)}公里 · 预计结束${safe(C.stamp(info.end))}</p></section>`;
    }).join('')}`;
  }
  $('export-pdf').addEventListener('click', () => { $('print-output').innerHTML = printHTML(currentPlan()); window.print(); });
  window.addEventListener('beforeprint', () => { $('print-output').innerHTML = printHTML(currentPlan()); });
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch (_) { notice('高德设置无法保存，请检查浏览器存储。', true); }
  }
  function amapStatus(message, error = false) { $('amap-status').textContent = message; $('amap-status').classList.toggle('error', error); }
  $('amap-key').value = settings.key; $('amap-security-code').value = settings.securityCode; $('amap-auto').checked = settings.auto;
  $('save-amap').addEventListener('click', () => {
    settings.key = $('amap-key').value.trim(); settings.securityCode = $('amap-security-code').value.trim(); settings.auto = $('amap-auto').checked; saveSettings();
    amapStatus(settings.key && settings.securityCode ? '高德设置已保存，可点击每段“高德重算”或“高德重算本日”。' : '请填写Key与安全密钥。', !(settings.key && settings.securityCode));
  });
  function timedOperation(executor, message) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), 20000);
      const done = value => { clearTimeout(timer); resolve(value); };
      const fail = error => { clearTimeout(timer); reject(error instanceof Error ? error : new Error(String(error))); };
      try { executor(done, fail); } catch (error) { fail(error); }
    });
  }
  function loadAmap() {
    if (!settings.key || !settings.securityCode) return Promise.reject(new Error('请先填写并保存高德Key与安全密钥。'));
    const signature = JSON.stringify([settings.key, settings.securityCode]);
    if (amapPromise && amapSignature === signature) return amapPromise;
    if (window.AMap && amapSignature && amapSignature !== signature) return Promise.reject(new Error('高德密钥已改变，请刷新页面后重新算路。'));
    amapSignature = signature;
    window._AMapSecurityConfig = { securityJsCode: settings.securityCode };
    amapPromise = timedOperation((resolve, reject) => {
      const plugins = ['AMap.PlaceSearch', 'AMap.Geocoder', 'AMap.Driving', 'AMap.Walking'];
      const ready = () => window.AMap.plugin(plugins, () => {
        if (plugins.some(name => typeof window.AMap[name.split('.')[1]] !== 'function')) reject(new Error('高德服务插件未加载成功，请检查Key类型、网络和域名设置。'));
        else resolve(window.AMap);
      });
      if (window.AMap) { ready(); return; }
      const callback = `__nextJourneyAmap${Date.now()}`;
      const script = document.createElement('script');
      window[callback] = () => { delete window[callback]; ready(); };
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(settings.key)}&plugin=${plugins.join(',')}&callback=${callback}`;
      script.onerror = () => { delete window[callback]; reject(new Error('高德加载失败，请检查网络。')); };
      document.head.appendChild(script);
    }, '高德加载超时，请检查网络和密钥设置。').catch(error => { amapPromise = null; throw error; });
    return amapPromise;
  }
  function locate(AMap, name) {
    if (!name.trim()) return Promise.reject(new Error('请先填写出发地与目的地名称。'));
    const query = name.replace(/^比亚迪闪充\s*[·•]\s*/, '').trim();
    return timedOperation((resolve, reject) => {
      new AMap.PlaceSearch({ pageSize: 5, city: '全国' }).search(query, (status, result) => {
        const poi = result?.poiList?.pois?.find(item => item.location);
        if (status === 'complete' && poi) { resolve({ location: poi.location, label: `${poi.cityname || ''}${poi.name}` }); return; }
        new AMap.Geocoder({}).getLocation(query, (geocodeStatus, geocodeResult) => {
          const place = geocodeResult?.geocodes?.[0];
          if (geocodeStatus === 'complete' && place?.location) resolve({ location: place.location, label: place.formattedAddress || name });
          else reject(new Error(`找不到“${name}”：${result?.info || geocodeResult?.info || status}。请补充城市与具体地址。`));
        });
      });
    }, `查询“${name}”超时。`);
  }
  function getRoute(AMap, origin, destination, mode) {
    return timedOperation((resolve, reject) => {
      const service = mode === 'walking' ? new AMap.Walking() : new AMap.Driving({ policy: AMap.DrivingPolicy.LEAST_TIME });
      service.search(origin, destination, (status, result) => {
        const route = result?.routes?.[0], seconds = Number(route?.time), meters = Number(route?.distance);
        if (status === 'complete' && seconds > 0 && meters > 0 && Number.isFinite(seconds) && Number.isFinite(meters)) resolve({ drive: seconds / 60, km: meters / 1000 });
        else reject(new Error(`路线无效或返回0分钟/0公里（${result?.info || status}）。已保留原值，请核对匹配地点。`));
      });
    }, '高德路线查询超时，已保留原值。');
  }
  async function updateRoute(planId, dayId, stopId) {
    const plan = library.plans.find(item => item.id === planId); if (!plan || plan.readonly) return;
    const day = findDay(plan, dayId), index = day?.stops.findIndex(stop => stop.id === stopId) ?? -1;
    const stop = index >= 0 ? day.stops[index] : null; if (!stop || stop.mode === 'none') return;
    const from = index > 0 ? day.stops[index - 1].name : day.origin;
    const fingerprint = C.routeKey(day, index), token = C.uid('job'), key = routeStateKey(plan, day, stop);
    routeJobs.set(key, token); routeStates.set(key, { status: 'loading', fingerprint, message: `正在查询：${from} → ${stop.name}` });
    if (activeId === planId) { render(true); amapStatus(`正在查询：${from} → ${stop.name}…`); }
    const stillValid = () => library.plans.includes(plan) && plan.days.includes(day) && day.stops.includes(stop) && routeJobs.get(key) === token && C.routeKey(day, day.stops.indexOf(stop)) === fingerprint;
    try {
      const AMap = await loadAmap();
      const [origin, destination] = await Promise.all([locate(AMap, from), locate(AMap, stop.name)]);
      const route = await getRoute(AMap, origin.location, destination.location, stop.mode);
      if (!stillValid()) return;
      stop.drive = Math.round(route.drive * 100) / 100; stop.km = Math.round(route.km * 10) / 10;
      stop.routeSource = 'amap'; stop.routeKey = fingerprint; stop.routeUpdatedAt = new Date().toISOString();
      stop.matchedOrigin = origin.label; stop.matchedDestination = destination.label;
      routeStates.delete(key); record(`高德更新：${stop.name} · ${duration(stop.drive)} · ${stop.km}公里`, plan);
      if (activeId === planId) { render(true); amapStatus(`已更新：${origin.label} → ${destination.label} · ${duration(stop.drive)} · ${stop.km}公里`); }
    } catch (error) {
      if (!stillValid()) return;
      routeStates.set(key, { status: 'error', fingerprint, message: error.message });
      if (activeId === planId) { render(true); amapStatus(error.message, true); }
    } finally { if (routeJobs.get(key) === token) routeJobs.delete(key); }
  }
  window.addEventListener('pagehide', persist);
  // Do not write the legacy storage key: the original National Day page keeps using it.
  persist(); saveSettings(); render();
  if (startupError) notice(startupError, true);
  if (JSON.stringify(archive) !== archiveSnapshot) throw new Error('Archive integrity check failed');
})();
