(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const number = (value, max = 100000) => Math.max(0, Math.min(max, Number(value) || 0));
  function dateValid(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  const timeValid = value => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
  function shiftDate(value, offset) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }
  function newStop(name = '') {
    return { id: uid('stop'), name, type: '景点', drive: 0, km: 0, stay: 30, mode: 'driving', hint: '', minTime: '', routeSource: 'manual', routeUpdatedAt: '' };
  }
  function newDay(date, origin = '') {
    return { id: uid('day'), date, start: '09:00', origin, title: '', notes: '', stops: [] };
  }
  function createPlan(name, date, count = 3, origin = '') {
    return { id: uid('trip'), name: name || '我的旅行', description: '', readonly: false, history: [], createdAt: new Date().toISOString(), days: Array.from({ length: Math.max(1, Math.min(90, count)) }, (_, index) => newDay(shiftDate(date, index), index === 0 ? origin : '')) };
  }
  function migrateLegacy(source) {
    const values = source.values || {};
    const legacyDays = [{ ...source.inbound, start: source.inboundStart || '02:00' }, ...source.tripDays];
    return {
      id: 'national-day-2026', name: '2026 国庆 · 福州 ⇄ 武汉', description: '方程豹钛7 · 仙岛湖、庐山山下、南昌夜景与沙县小吃', readonly: true,
      createdAt: new Date().toISOString(), history: clone(source.history || []),
      days: legacyDays.map(day => ({
        id: uid('day'), date: `2026-10-${String(day.date).padStart(2, '0')}`, start: day.start, origin: day.origin || '', title: day.title || '', notes: day.subtitle || '',
        stops: (day.stops || []).map(stop => ({
          id: stop.id || uid('stop'), name: stop.name || '', type: stop.type || '景点', drive: stop.driveSeconds !== undefined ? stop.driveSeconds / 60 : number(stop.drive),
          km: number(stop.km), stay: number(values[stop.id]), mode: stop.transfer ? 'none' : 'driving', hint: stop.hint || '', minTime: stop.minTime || '',
          routeSource: stop.routeSource ? 'amap' : 'manual', routeUpdatedAt: '', matchedOrigin: '', matchedDestination: ''
        }))
      }))
    };
  }
  function duplicatePlan(plan) {
    const copy = clone(plan);
    copy.id = uid('trip'); copy.name = `${plan.name} · 副本`; copy.readonly = false;
    copy.createdAt = new Date().toISOString(); copy.updatedAt = ''; copy.history = [];
    copy.days.forEach(day => { day.id = uid('day'); day.stops.forEach(stop => { stop.id = uid('stop'); }); });
    return copy;
  }
  function assertEditable(plan) {
    if (!plan || plan.readonly || plan.id === 'national-day-2026') throw new Error('国庆存档只读，请先复制为新行程。');
  }
  function setStartDate(plan, date) {
    assertEditable(plan);
    if (!dateValid(date)) throw new Error('请选择有效日期。');
    const delta = (new Date(`${date}T00:00:00Z`) - new Date(`${plan.days[0].date}T00:00:00Z`)) / 86400000;
    plan.days.forEach(day => { day.date = shiftDate(day.date, delta); });
  }
  function resizeDays(plan, count) {
    assertEditable(plan);
    if (!Number.isInteger(count) || count < 1 || count > 90) throw new Error('天数请填写1至90之间的整数。');
    while (plan.days.length < count) {
      const last = plan.days.at(-1);
      plan.days.push(newDay(shiftDate(last.date, 1), last.stops.at(-1)?.name || last.origin));
    }
    plan.days.splice(count);
  }
  function routeKey(day, index) {
    const stop = day.stops[index];
    return JSON.stringify([index ? day.stops[index - 1].name : day.origin, stop?.name, stop?.mode]);
  }
  function invalidateRoutes(day) {
    day.stops.forEach((stop, index) => {
      if (stop.routeSource === 'amap' && stop.routeKey !== routeKey(day, index)) stop.routeSource = 'stale';
    });
  }
  function compute(day) {
    let cursor = new Date(`${day.date}T${day.start}:00+08:00`);
    let travel = 0, stayTotal = 0, waiting = 0, km = 0;
    const stops = day.stops.map(stop => {
      const routeMinutes = stop.mode === 'none' ? 0 : number(stop.drive);
      travel += routeMinutes; km += stop.mode === 'none' ? 0 : number(stop.km);
      const arrival = new Date(cursor.getTime() + routeMinutes * 60000);
      const earliest = stop.minTime && timeValid(stop.minTime) ? new Date(`${day.date}T${stop.minTime}:00+08:00`) : arrival;
      const wait = Math.max(0, Math.ceil((earliest - arrival) / 60000));
      const stay = number(stop.stay, 10080);
      waiting += wait; stayTotal += stay;
      const depart = new Date(arrival.getTime() + (wait + stay) * 60000);
      cursor = depart;
      return { ...stop, arrival, depart, wait };
    });
    return { stops, end: cursor, travel, stay: stayTotal, waiting, km };
  }
  function stamp(date) {
    const shifted = new Date(date.getTime() + 8 * 3600000);
    return `${shifted.toISOString().slice(0, 10)} ${shifted.toISOString().slice(11, 16)}`;
  }
  function normalizePlan(raw) {
    if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.days) || raw.days.length < 1 || raw.days.length > 90) throw new Error('行程文件格式不正确。');
    const plan = createPlan(raw.name.slice(0, 100), '2026-01-01', 1);
    plan.description = String(raw.description || '').slice(0, 3000);
    plan.days = raw.days.map(day => {
      if (!dateValid(day.date) || !timeValid(day.start) || !Array.isArray(day.stops) || day.stops.length > 200) throw new Error('日期、出发时间或目的地列表格式不正确。');
      return { ...newDay(day.date, String(day.origin || '').slice(0, 200)), start: day.start, title: String(day.title || '').slice(0, 200), notes: String(day.notes || '').slice(0, 3000), stops: day.stops.map(stop => ({
        ...newStop(String(stop.name || '').slice(0, 200)), type: String(stop.type || '景点').slice(0, 50), drive: number(stop.drive, 10080), stay: number(stop.stay, 10080), km: number(stop.km),
        mode: ['driving', 'walking', 'none'].includes(stop.mode) ? stop.mode : 'driving', hint: String(stop.hint || '').slice(0, 3000), minTime: timeValid(stop.minTime) ? stop.minTime : '', routeSource: 'manual'
      })) };
    });
    return plan;
  }
  root.TripCore = { clone, uid, number, dateValid, timeValid, shiftDate, newStop, newDay, createPlan, migrateLegacy, duplicatePlan, assertEditable, setStartDate, resizeDays, routeKey, invalidateRoutes, compute, stamp, normalizePlan };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TripCore;
})(typeof window !== 'undefined' ? window : globalThis);
