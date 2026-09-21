const defaultTripDays = [
  {
    date: 2, start: '14:00', origin: '全季武汉光谷湖北经济学院酒店', title: '武汉 → 仙岛湖 → 瑞昌', subtitle: '14:00从已订全季出发 · 揽胜亭后坐公交船 · 已订九江快乐城美仑酒店',
    stops: [
      { id: 'lake', name: '仙岛湖 · 揽胜亭', drive: 98, km: 118.0, type: '景点', hint: '导航点为高德“揽胜亭”；停车、步行上亭及看全景的时间请填在这里。' },
      { id: 'pier', name: '王英客运码头 · 公交船往返', drive: 6, km: 2.6, type: '公交船', hint: '驾车导航点为高德“王英码头”，不在岛上游玩。你发的攻略称单程约30—40分钟；请把等船、上下船和往返航行总时间填在这里。国庆船班须码头确认。' },
      { id: 'wanging', name: '王英镇 · 晚餐 / 休息', drive: 0, type: '补给', hint: '码头附近补给，停车和用餐时间填在这里。' },
      { id: 'ruichang', name: '九江快乐城美仑酒店', drive: 96, km: 109.1, type: '住宿', hint: '10月2日至3日已订；请在高德搜索“九江快乐城美仑酒店”核对具体入口和停车场。' }
    ]
  },
  {
    date: 3, start: '09:30', origin: '九江快乐城美仑酒店', title: '庐山山下 → 南昌夜景', subtitle: '09:30出发 · 落星墩后先到象湖星程入住 · 再看夜景',
    stops: [
      { id: 'donglin', name: '东林寺祖庭', drive: 53, km: 38.7, type: '景点', hint: '高德导航点为“东林寺”，不是东林大佛；停车和入寺时间另填。' },
      { id: 'xiufeng', name: '秀峰 · 山下远观', drive: 60, km: 38.2, type: '景点', hint: '高德导航点为“秀峰风景名胜区”入口附近；仅在山下看瀑，不进山。门外视线与水量不能保证。' },
      { id: 'lunch', name: '庐山市 · 午餐 / 休息', drive: 21, km: 7.0, type: '补给', hint: '为算路选“庐山市人民政府”作城区导航参照点，吃饭地点可能不同；停留及停车时间另填。' },
      { id: 'luoxing', name: '落星墩 · 鄱阳湖畔', drive: 6, km: 1.6, type: '景点', hint: '高德导航点为“落星墩”；景观受鄱阳湖水位影响，出发前核对。' },
      { id: 'checkin', name: '星程南昌象湖南大一附院酒店 · 先入住', drive: 156, km: 122.9, type: '入住', hint: '从落星墩先到你已订的星程；办理入住、停车、休整和晚餐时间都填在这里。随后再开车看夜景。' },
      { id: 'bayi', name: '八一广场', drive: 32, km: 11.2, type: '夜景', hint: '从象湖星程出发，高德导航点为“八一广场”；南昌晚到时这是第一处可删的景点，删站后须重新算路。' },
      { id: 'tengwang', name: '滕王阁 · 外观夜景', drive: 20, km: 4.2, type: '夜景', minTime: '18:30', hint: '高德导航点为“滕王阁”；只看外围夜景、不买票入阁。提前到达会等到夜景计划时间。' },
      { id: 'qiushui', name: '秋水广场', drive: 17, km: 5.6, type: '夜景', minTime: '19:50', hint: '高德导航点为“赣江市民公园-秋水广场”；想看20:00喷泉，停留至少填40分钟，遇雨可能停演。' },
      { id: 'wheel', name: '南昌之星 · 摩天轮外围', drive: 9, km: 3.3, type: '夜景', minTime: '20:45', hint: '高德导航点为“南昌之星摩天轮”；只看外观、不乘坐。' },
      { id: 'starway', name: '返回星程南昌象湖南大一附院酒店', drive: 28, km: 14.4, type: '住宿', hint: '夜景结束返回已入住的同一家星程；10月3日至4日已订。' }
    ]
  },
  {
    date: 4, start: '07:30', origin: '星程南昌象湖南大一附院酒店', title: '南昌 → 沙县小吃 → 福州', subtitle: '沙县城区停一次车 · 步行吃几样三明小吃 · 前往三江口',
    stops: [
      { id: 'shaxian', name: '沙县 · 建国路停车场 / 小吃步行圈', drive: 254, km: 365.6, type: '停车', map: 'https://www.amap.com/place/B0K3NAEX4M', hint: '高德导航点为“沙县东门古街(建国路)停车场”；只是停车参照点，不必进古街。找位、停好车的时间填这里，满位时当天另找附近停车点。' },
      { id: 'miaomen', name: '庙门扁肉 · 建国路旗舰总店', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256003F9', transfer: '从停车场步行 · 无开车转场', hint: '先试手打扁肉，可搭拌面；高德店点在建国路。步行、等位和吃这家的时间一起填写。国庆营业须提前核对。' },
      { id: 'baozhu', name: '宝珠沙县小吃 · 府前中路店', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256001E0', transfer: '沿府前中路步行 · 无开车转场', hint: '尝葱肉饼；高德店点在府前中路194号。按当天店内供应选择，步行及排队时间也填在这里。' },
      { id: 'jialan', name: '佳兰烧麦 · 府前中路', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0256002A4', transfer: '沿府前中路步行 · 无开车转场', hint: '试沙县烧麦，和常见糯米烧麦口感不同；店点以高德“佳兰烧麦”为准，营业和排队须当天确认。' },
      { id: 'yujiao', name: '淳古味 · 芋饺 / 米冻皮', drive: 0, type: '美食', map: 'https://www.amap.com/place/B0LKKZN7WO', transfer: '沿府前中路步行 · 无开车转场', hint: '高德店点为“淳古味老沙县芋饺·米冻皮(步行街店)”；把步行、点餐、吃完返回停车场的时间都填在这里。' },
      { id: 'fuzhou', name: '福州 · 三江口', drive: 165, km: 232.1, type: '到达', hint: '这一段从沙县建国路停车场起算；终点暂以“三江口地铁站”为参照点。你家具体地址未提供，最后一段以当天导航为准。' }
    ]
  }
];

const defaultInbound = {
  date: 1,
  origin: '福州湾二期（西北门）',
  title: '福州 → 顺昌 → 抚州 → 九江 → 武汉',
  subtitle: '方程豹钛7 · 10月1日凌晨出发 · 顺路停靠3处比亚迪闪充站 · 住已订武汉全季',
  stops: [
    { id: 'charge1', name: '比亚迪闪充 · 南平顺昌合掌岩收费站出口', driveSeconds: 9965, km: 241.4, type: '闪充', map: 'https://www.amap.com/search?query=%E5%8D%97%E5%B9%B3%E9%A1%BA%E6%98%8C%E5%90%88%E6%8E%8C%E5%B2%A9%E6%94%B6%E8%B4%B9%E7%AB%99%E5%87%BA%E5%8F%A3%20%E9%97%AA%E5%85%85', hint: '截图第一站；位于收费站出口附近。把下高速、等桩、闪充和休息合计填在这里。' },
    { id: 'charge2', name: '比亚迪闪充 · 抚州罗针收费站入口', driveSeconds: 9625, km: 249.4, type: '闪充', map: 'https://www.amap.com/search?query=%E6%8A%9A%E5%B7%9E%E7%BD%97%E9%92%88%E6%94%B6%E8%B4%B9%E7%AB%99%E5%85%A5%E5%8F%A3%20%E9%97%AA%E5%85%85', hint: '截图第二站；在罗针收费站入口附近。闪充、用餐及司机休息时间合并填写。' },
    { id: 'charge3', name: '比亚迪闪充 · 九江东林大佛', driveSeconds: 7872, km: 203.1, type: '闪充', map: 'https://www.amap.com/search?query=%E4%B9%9D%E6%B1%9F%E4%B8%9C%E6%9E%97%E5%A4%A7%E4%BD%9B%20%E9%97%AA%E5%85%85', hint: '截图第三站；这是东林大佛附近的比亚迪闪充站，不是返程10月3日要去的东林寺祖庭。' },
    { id: 'wuhan_in', name: '全季武汉光谷湖北经济学院酒店', driveSeconds: 9065, km: 229.2, type: '住宿', hint: '10月1日至2日已订。到店后的入住、休息不计入当天抵达时间；10月2日返程固定14:00从这里出发。' }
  ]
};
let tripDays = JSON.parse(JSON.stringify(defaultTripDays));
let inbound = JSON.parse(JSON.stringify(defaultInbound));
let inboundStart = '02:00';

const STORAGE_KEY = 'hust-fuzhou-roadtrip-planner-v2';
const values = Object.create(null);
let changeHistory = [];
let saveTimer = null;

function snapshot() {
  return {
    version: 2,
    tripDays: JSON.parse(JSON.stringify(tripDays)),
    inbound: JSON.parse(JSON.stringify(inbound)),
    inboundStart,
    values: { ...values },
    history: changeHistory.slice(-60)
  };
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.version !== 2) return;
    if (Array.isArray(saved.tripDays)) tripDays = saved.tripDays;
    if (saved.inbound && Array.isArray(saved.inbound.stops)) inbound = saved.inbound;
    if (/^\d{2}:\d{2}$/.test(saved.inboundStart || '')) inboundStart = saved.inboundStart;
    if (saved.values && typeof saved.values === 'object') Object.assign(values, saved.values);
    if (Array.isArray(saved.history)) changeHistory = saved.history.slice(-60);
    const oldRuichang = tripDays.find(day => day.date === 2)?.stops.find(stop => stop.id === 'ruichang');
    if (oldRuichang?.name === '汉庭九江瑞昌广场酒店') {
      oldRuichang.name = '九江快乐城美仑酒店';
      oldRuichang.hint = '10月2日至3日已订；请在高德搜索“九江快乐城美仑酒店”核对具体入口和停车场。';
    }
    const oldRuichangOrigin = tripDays.find(day => day.date === 3);
    if (oldRuichangOrigin?.origin === '汉庭九江瑞昌广场酒店') oldRuichangOrigin.origin = '九江快乐城美仑酒店';
  } catch (_) {}
}

function saveState(label = '修改行程') {
  const item = { at: new Date().toISOString(), label };
  changeHistory.push(item);
  changeHistory = changeHistory.slice(-60);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot())); } catch (_) {}
  updateSaveStatus();
}

function queueSave(label) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(label), 350);
}

function updateSaveStatus() {
  const status = document.getElementById('save-status');
  const history = document.getElementById('change-history');
  if (status) {
    const last = changeHistory.at(-1);
    status.textContent = last ? `已保存 · ${new Date(last.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : '尚未修改';
  }
  if (history) {
    history.innerHTML = changeHistory.length ? changeHistory.slice().reverse().slice(0, 12).map(item => `<li><time>${safe(new Date(item.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}</time><span>${safe(item.label)}</span></li>`).join('') : '<li class="empty-history">还没有修改记录</li>';
  }
}

loadSavedState();

const minutes = value => Math.max(0, Number.isFinite(Number(value)) ? Math.min(1440, Number(value)) : 0);
const pad = num => String(num).padStart(2, '0');
const at = (day, time) => { const [hour, minute] = time.split(':').map(Number); return new Date(2026, 9, day, hour, minute); };
const add = (date, amount) => new Date(date.getTime() + amount * 60000);
const addSeconds = (date, amount) => new Date(date.getTime() + amount * 1000);
const stamp = date => `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
const stampRounded = date => stamp(new Date(date.getTime() + 30000));
const clock = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
const duration = amount => amount >= 60 ? `${Math.floor(amount / 60)}小时${amount % 60 ? `${amount % 60}分` : ''}` : `${amount}分钟`;
const safe = string => String(string).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function compute(day) {
  let cursor = at(day.date, day.start), driving = 0, playing = 0, waiting = 0;
  const stops = day.stops.map(stop => {
    driving += stop.drive;
    const arrival = add(cursor, stop.drive);
    let wait = 0;
    if (stop.minTime) {
      const earliest = at(day.date, stop.minTime);
      if (arrival < earliest) wait = Math.ceil((earliest - arrival) / 60000);
    }
    waiting += wait;
    const visitStart = add(arrival, wait);
    const play = stop.type === '住宿' || stop.type === '到达' ? 0 : minutes(values[stop.id] ?? '');
    playing += play;
    const depart = add(visitStart, play);
    cursor = depart;
    return { ...stop, arrival, visitStart, depart, wait, play };
  });
  return { stops, end: cursor, driving, playing, waiting };
}

function computeInbound() {
  let cursor = at(1, inboundStart), drivingSeconds = 0, charging = 0;
  const stops = inbound.stops.map(stop => {
    drivingSeconds += stop.driveSeconds;
    const arrival = addSeconds(cursor, stop.driveSeconds);
    const play = stop.type === '闪充' ? minutes(values[stop.id] ?? '') : 0;
    charging += play;
    const depart = add(arrival, play);
    cursor = depart;
    return { ...stop, arrival, depart, play };
  });
  return { stops, end: cursor, drivingSeconds, charging };
}

function renderInbound() {
  const info = computeInbound();
  const missing = info.stops.some(stop => stop.type === '闪充' && values[stop.id] === undefined);
  const terminalIndex = info.stops.findIndex(stop => stop.type === '住宿');
  const maxMovableIndex = (terminalIndex === -1 ? info.stops.length : terminalIndex) - 1;
  const cards = info.stops.map((stop, index) => {
    const editable = stop.type === '闪充';
    const deletable = stop.type !== '住宿';
    const movable = index <= maxMovableIndex;
    return `<article class="stop ${editable ? 'charger' : 'hotel'}">
      <div class="drive">从上一站开车 · ${duration(Math.round(stop.driveSeconds / 60))} · ${stop.km.toFixed(1)}公里（高德路线）</div>
      <div class="stop-title"><h3 class="editable-name"><input data-name-stop="${safe(stop.id)}" data-day="inbound" type="text" maxlength="60" value="${safe(stop.name)}" aria-label="编辑地点名称：${safe(stop.name)}" title="点击修改地点名称"></h3><div class="stop-actions"><span class="badge">${safe(stop.type)}</span>${movable ? `<button class="move-stop" type="button" data-move-stop="${safe(stop.id)}" data-day="inbound" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑ 上移</button><button class="move-stop" type="button" data-move-stop="${safe(stop.id)}" data-day="inbound" data-direction="1" ${index === maxMovableIndex ? 'disabled' : ''}>↓ 下移</button>` : ''}${deletable ? `<button class="delete-stop" type="button" data-delete-stop="${safe(stop.id)}" data-day="inbound">删除</button>` : ''}</div></div>
      <p class="tip">${safe(stop.hint)}</p>
      ${stop.map ? `<a class="map-link" href="${safe(stop.map)}" target="_blank" rel="noopener">在高德核对比亚迪闪充站 ↗</a>` : ''}
      <div class="route-edit"><label for="drive-inbound-${safe(stop.id)}">从上一站开车</label><input id="drive-inbound-${safe(stop.id)}" data-drive-stop="${safe(stop.id)}" data-day="inbound" type="number" min="0" max="1440" step="1" value="${Math.round(stop.driveSeconds / 60)}" inputmode="numeric">分钟 <em>换序后请按高德修正</em></div>
      <div class="times"><span>抵达 <strong>${stampRounded(stop.arrival)}</strong></span><span class="depart">${editable ? '离开' : '到店'} <strong>${stampRounded(stop.depart)}</strong></span></div>
      ${editable ? `<div class="play"><label for="play-${stop.id}">闪充 / 休息总时长</label><div class="input-wrap"><input id="play-${stop.id}" data-stop="${stop.id}" type="number" min="0" max="1440" step="5" inputmode="numeric" placeholder="如 30" value="${safe(values[stop.id] ?? '')}" aria-label="${safe(stop.name)}闪充和休息总分钟数">分钟</div></div>` : ''}
    </article>`;
  }).join('');
  document.getElementById('inbound').innerHTML = `<section class="day inbound-day" aria-label="10月1日福州开往武汉行程">
    <div class="day-head"><div class="day-meta">来程 · 10月1日 · 出发时间可调</div><h2>${safe(inbound.title)}</h2><p>${safe(inbound.subtitle)}</p>
      <div class="start-picker"><label for="inbound-start">从福州湾二期出发</label><input id="inbound-start" type="time" value="${safe(inboundStart)}" step="300" aria-label="10月1日福州出发时间"><small>02:00仅作凌晨出发示例，可改为你的实际时刻</small></div>
      <div class="day-result"><div><small>预计到武汉全季</small><br><strong>${stampRounded(info.end)}</strong></div><div class="result-right"><small>驾驶 ${duration(Math.round(info.drivingSeconds / 60))}</small><br><small>闪充 / 休息 ${duration(info.charging)}</small></div></div>
    </div><div class="stops">${cards}</div>
    <div class="day-foot"><p>截图选中高德路线：10小时9分 · 923.1公里 · 过路费约¥487；分段驾驶合计按秒计算，页面抵离时间显示到分钟。</p><p class="${missing ? 'warn' : ''}">${missing ? '闪充时间尚未全部填写：当前抵达时间按未填项0分钟计算，请填入闪充、排队及休息用时。' : '已填写的三站闪充与休息时间，会逐站推迟后续抵达时间。'}</p><p>站点与路段以9月路线查询作计划参照；国庆当天可能拥堵，桩位、可用状态及出入口请在高德/充电平台实时确认。</p></div>
  </section>`;
}

function render() {
  renderInbound();
  const target = document.getElementById('days');
  target.innerHTML = tripDays.map(day => {
    const info = compute(day);
    const last = info.stops.at(-1);
    const resultLabel = day.date === 4 ? '预计到三江口' : '预计到酒店';
    const notes = [];
    const pierStop = info.stops.find(stop => stop.id === 'pier');
    if (day.date === 2 && pierStop && pierStop.arrival >= at(2, '15:30')) notes.push('14:00出发按高德最快也约15:44才到王英码头（未算揽胜亭停留）。你发的攻略称去程末班16:00，但不是国庆班次；先看亭再坐往返船很可能赶不上，务必向码头确认更晚班次。');
    if (day.date === 2 && info.end >= at(3, '00:00')) notes.push('10月2日到瑞昌已跨到午夜，请缩短停留或调整计划。');
    else if (day.date === 2 && info.end >= at(2, '21:30')) notes.push('瑞昌预计21:30后才到店，次日09:30出发仍需留足休息。');
    if (day.date === 3 && info.end >= at(4, '00:00')) notes.push('夜景结束返回南昌酒店已跨到10月4日，次日仍按07:30出发。');
    else if (day.date === 3 && info.end >= at(3, '22:30')) notes.push('夜景结束预计22:30后才回酒店，建议压缩夜景停留。');
    const checkinStop = info.stops.find(stop => stop.id === 'checkin');
    if (day.date === 3 && checkinStop && checkinStop.arrival >= at(3, '18:00')) notes.push('18:00后才到星程办理入住，八一广场可先删；删站后要用高德当天导航重新算路。');
    if (day.date === 4 && info.end.getDate() > 4) notes.push('预计10月5日才到三江口；可考虑沙县住一晚。');
    else if (day.date === 4 && info.stops.find(stop => stop.id === 'yujiao')?.depart >= at(4, '16:00')) notes.push('沙县小吃步行圈预计16:00后才结束；留意疲劳和夜间路况。');
    const terminalIndex = info.stops.findIndex(stop => stop.type === '住宿' || stop.type === '到达');
    const maxMovableIndex = (terminalIndex === -1 ? info.stops.length : terminalIndex) - 1;
    const cards = info.stops.map((stop, index) => {
      const editable = stop.type !== '住宿' && stop.type !== '到达' && stop.type !== '入住';
      const deletable = editable;
      const movable = index <= maxMovableIndex;
      const kind = stop.type === '住宿' || stop.type === '入住' ? 'hotel' : stop.type === '到达' ? 'finish' : '';
      return `<article class="stop ${kind}">
        <div class="drive">${stop.drive === 0 ? safe(stop.transfer || '同在王英码头 · 无公路转场') : `从上一站开车 · ${duration(stop.drive)} · ${stop.km.toFixed(1)}公里（高德）`}</div>
        <div class="stop-title"><h3 class="editable-name"><input data-name-stop="${safe(stop.id)}" data-day="${day.date}" type="text" maxlength="60" value="${safe(stop.name)}" aria-label="编辑地点名称：${safe(stop.name)}" title="点击修改地点名称"></h3><div class="stop-actions"><span class="badge">${safe(stop.type)}</span>${movable ? `<button class="move-stop" type="button" data-move-stop="${safe(stop.id)}" data-day="${day.date}" data-direction="-1" ${index === 0 ? 'disabled' : ''}>↑ 上移</button><button class="move-stop" type="button" data-move-stop="${safe(stop.id)}" data-day="${day.date}" data-direction="1" ${index === maxMovableIndex ? 'disabled' : ''}>↓ 下移</button>` : ''}${deletable ? `<button class="delete-stop" type="button" data-delete-stop="${safe(stop.id)}" data-day="${day.date}">删除</button>` : ''}</div></div>
        <p class="tip">${safe(stop.hint)}</p>
        ${stop.map ? `<a class="map-link" href="${safe(stop.map)}" target="_blank" rel="noopener">查看高德位置 ↗</a>` : ''}
        <div class="route-edit"><label for="drive-${day.date}-${safe(stop.id)}">从上一站开车</label><input id="drive-${day.date}-${safe(stop.id)}" data-drive-stop="${safe(stop.id)}" data-day="${day.date}" type="number" min="0" max="1440" step="1" value="${stop.drive}" inputmode="numeric">分钟 <em>换序后请按高德修正</em></div>
        <div class="times"><span>抵达 <strong>${stamp(stop.arrival)}</strong></span><span class="depart">${editable ? '离开' : '时间'} <strong>${stamp(stop.depart)}</strong></span></div>
        ${stop.wait ? `<div class="wait">等到夜景计划时间 · ${duration(stop.wait)}</div>` : ''}
        ${editable ? `<div class="play"><label for="play-${stop.id}">${stop.id === 'pier' ? '坐船往返总时长' : '停留时间'}</label><div class="input-wrap"><input id="play-${stop.id}" data-stop="${stop.id}" type="number" min="0" max="1440" step="5" inputmode="numeric" placeholder="${stop.id === 'pier' ? '如 90' : '0'}" value="${safe(values[stop.id] ?? '')}" aria-label="${safe(stop.name)}${stop.id === 'pier' ? '坐船往返总分钟数' : '停留分钟数'}">分钟</div></div>` : ''}
      </article>`;
    }).join('');
    return `<section class="day" aria-label="10月${day.date}日行程">
      <div class="day-head"><div class="day-meta">10月${day.date}日 · ${day.start}从${safe(day.origin)}出发</div><h2>${safe(day.title)}</h2><p>${safe(day.subtitle)}</p>
      <div class="day-result"><div><small>${resultLabel}</small><br><strong>${stamp(last.arrival)}</strong></div><div class="result-right"><small>驾驶 ${duration(info.driving)}</small><br><small>停留 ${duration(info.playing)}</small></div></div></div>
      <div class="stops">${cards}</div>
      <div class="day-foot"><p>高德规划驾驶合计 ${duration(info.driving)} · 已填停留 ${duration(info.playing)}${info.waiting ? ` · 自动等待 ${duration(info.waiting)}` : ''}</p>${notes.length ? notes.map(note => `<p class="warn">${safe(note)}</p>`).join('') : '<p>路段时间固定；填写停留分钟后，后续时间会更新。</p>'}</div>
    </section>`;
  }).join('');
  updateSaveStatus();
}

function toggleEditor(open) {
  const panel = document.getElementById('editor-panel');
  if (!panel) return;
  panel.hidden = open === undefined ? !panel.hidden : !open;
  if (!panel.hidden) document.getElementById('edit-name')?.focus();
}

function removeStop(dayKey, stopId) {
  const target = dayKey === 'inbound' ? inbound : tripDays.find(day => String(day.date) === String(dayKey));
  if (!target) return;
  const stop = target.stops.find(item => item.id === stopId);
  if (!stop || stop.type === '住宿' || stop.type === '到达' || stop.type === '入住') return;
  if (!window.confirm(`删除“${stop.name}”？删除后后续时间会重新计算。`)) return;
  target.stops = target.stops.filter(item => item.id !== stopId);
  delete values[stopId];
  render();
  saveState(`删除目的地：${stop.name}`);
}

function moveStop(dayKey, stopId, direction) {
  const target = dayKey === 'inbound' ? inbound : tripDays.find(day => String(day.date) === String(dayKey));
  if (!target) return;
  const index = target.stops.findIndex(item => item.id === stopId);
  if (index < 0) return;
  const terminalIndex = target.stops.findIndex(item => item.type === '住宿' || item.type === '到达');
  const maxMovableIndex = (terminalIndex === -1 ? target.stops.length : terminalIndex) - 1;
  const nextIndex = index + Number(direction);
  if (index > maxMovableIndex || nextIndex < 0 || nextIndex > maxMovableIndex) return;
  const [stop] = target.stops.splice(index, 1);
  target.stops.splice(nextIndex, 0, stop);
  render();
  saveState(`调整顺序：${stop.name}${Number(direction) < 0 ? '上移' : '下移'}`);
}

document.getElementById('toggle-editor')?.addEventListener('click', () => toggleEditor());
document.getElementById('cancel-editor')?.addEventListener('click', () => toggleEditor(false));
document.getElementById('export-pdf')?.addEventListener('click', () => {
  toggleEditor(false);
  window.setTimeout(() => window.print(), 50);
});
document.getElementById('reset-plan')?.addEventListener('click', () => {
  if (!window.confirm('恢复默认行程？当前新增、删除和停留时间都会清除。')) return;
  tripDays = JSON.parse(JSON.stringify(defaultTripDays));
  inbound = JSON.parse(JSON.stringify(defaultInbound));
  inboundStart = '02:00';
  Object.keys(values).forEach(key => delete values[key]);
  changeHistory = [];
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  render();
  saveState('恢复默认行程');
});

document.getElementById('stop-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const dayKey = document.getElementById('edit-day').value;
  const target = dayKey === 'inbound' ? inbound : tripDays.find(day => String(day.date) === dayKey);
  const name = document.getElementById('edit-name').value.trim();
  if (!target || !name) return;
  const id = `custom-${Date.now()}`;
  const type = document.getElementById('edit-type').value;
  const drive = minutes(document.getElementById('edit-drive').value);
  const km = Math.max(0, Number(document.getElementById('edit-km').value) || 0);
  const stay = minutes(document.getElementById('edit-stay').value);
  const hint = document.getElementById('edit-hint').value.trim() || '自定义目的地；请按当天高德导航、停车和现场情况调整。';
  const stop = dayKey === 'inbound'
    ? { id, name, driveSeconds: drive * 60, km, type, hint, custom: true }
    : { id, name, drive, km, type, hint, custom: true };
  const fixedIndex = target.stops.findIndex(item => item.type === '住宿' || item.type === '入住' || item.type === '到达');
  target.stops.splice(fixedIndex === -1 ? target.stops.length : fixedIndex, 0, stop);
  if (stay > 0 && type !== '住宿' && type !== '到达' && type !== '入住') values[id] = String(stay);
  event.target.reset();
  document.getElementById('edit-drive').value = '30';
  document.getElementById('edit-km').value = '0';
  document.getElementById('edit-stay').value = '30';
  render();
  saveState(`新增目的地：${name}`);
});

document.addEventListener('click', event => {
  const moveButton = event.target.closest('[data-move-stop]');
  if (moveButton) {
    moveStop(moveButton.dataset.day, moveButton.dataset.moveStop, moveButton.dataset.direction);
    return;
  }
  const button = event.target.closest('[data-delete-stop]');
  if (button) removeStop(button.dataset.day, button.dataset.deleteStop);
});

document.addEventListener('input', event => {
  const input = event.target.closest('input[data-stop]');
  if (!input) return;
  if (input.value !== '') input.value = String(minutes(input.value));
  values[input.dataset.stop] = input.value;
  const stopId = input.dataset.stop;
  const caret = input.selectionStart;
  render();
  const replacement = document.getElementById(`play-${stopId}`);
  replacement?.focus({ preventScroll: true });
  if (caret !== null) try { replacement.setSelectionRange(caret, caret); } catch (_) {}
  queueSave('更新停留时间');
});

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('input[data-name-stop]')) {
    event.preventDefault();
    event.target.blur();
  }
});

document.addEventListener('change', event => {
  const nameInput = event.target.closest('input[data-name-stop]');
  if (nameInput) {
    const dayKey = nameInput.dataset.day;
    const target = dayKey === 'inbound' ? inbound : tripDays.find(day => String(day.date) === String(dayKey));
    const stop = target?.stops.find(item => item.id === nameInput.dataset.nameStop);
    if (!stop) return;
    const nextName = nameInput.value.trim();
    if (!nextName) {
      nameInput.value = stop.name;
      return;
    }
    const previousName = stop.name;
    stop.name = nextName;
    render();
    saveState(`修改地点名称：${previousName} → ${nextName}`);
    return;
  }
  const driveInput = event.target.closest('input[data-drive-stop]');
  if (driveInput) {
    const dayKey = driveInput.dataset.day;
    const target = dayKey === 'inbound' ? inbound : tripDays.find(day => String(day.date) === String(dayKey));
    const stop = target?.stops.find(item => item.id === driveInput.dataset.driveStop);
    if (!stop) return;
    const drive = minutes(driveInput.value);
    driveInput.value = String(drive);
    if (dayKey === 'inbound') stop.driveSeconds = drive * 60;
    else stop.drive = drive;
    render();
    saveState(`更新路段时间：${stop.name} ${drive}分钟`);
    return;
  }
  if (event.target?.id !== 'inbound-start') return;
  if (/^\d{2}:\d{2}$/.test(event.target.value)) inboundStart = event.target.value;
  render();
  saveState('调整10月1日出发时间');
});

render();

const context = document.modelContext;
if (context?.registerTool) {
  const stopIds = inbound.stops.filter(stop => stop.type === '闪充').map(stop => stop.id).concat(tripDays.flatMap(day => day.stops.filter(stop => stop.type !== '住宿' && stop.type !== '到达').map(stop => stop.id)));
  const snapshot = () => [{
    date: '2026-10-01', fixedStart: false, start: inboundStart, end: stampRounded(computeInbound().end),
    stops: computeInbound().stops.map(stop => ({ id: stop.id, name: stop.name, arrival: stampRounded(stop.arrival), departure: stampRounded(stop.depart), stayMinutes: stop.play, fixedDriveSeconds: stop.driveSeconds }))
  }, ...tripDays.map(day => {
    const info = compute(day);
    return {
      date: `2026-10-${pad(day.date)}`,
      fixedStart: day.start,
      end: stamp(info.end),
      stops: info.stops.map(stop => ({ id: stop.id, name: stop.name, arrival: stamp(stop.arrival), departure: stamp(stop.depart), stayMinutes: stop.play, waitingMinutes: stop.wait, fixedDriveMinutes: stop.drive }))
    };
  })];
  const tools = [
    {
      name: 'read_trip_schedule', title: '读取自驾时间表',
      description: '读取当前各站的固定驾驶时间、已填写停留时间和抵离时间，不修改行程。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => ({ days: snapshot() })
    },
    {
      name: 'set_trip_stop_times', title: '填写游玩时间',
      description: '批量填写各目的地停留分钟数，并更新页面上后续抵离时间；路段驾驶时间保持不变。',
      inputSchema: { type: 'object', properties: { stayMinutesByStop: { type: 'object', additionalProperties: { type: 'integer', minimum: 0, maximum: 1440 } } }, required: ['stayMinutesByStop'], additionalProperties: false },
      annotations: { readOnlyHint: false },
      execute: input => {
        const changes = input?.stayMinutesByStop;
        if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('请提供站点与停留分钟数。');
        const entries = Object.entries(changes);
        if (!entries.length) throw new Error('至少填写一个站点。');
        for (const [id, amount] of entries) {
          if (!stopIds.includes(id) || !Number.isInteger(amount) || amount < 0 || amount > 1440) throw new Error(`无效站点或停留时间：${id}`);
        }
        for (const [id, amount] of entries) values[id] = String(amount);
        render();
        return { updatedStops: entries.map(([id]) => id), days: snapshot() };
      }
    }
  ];
  for (const tool of tools) {
    try { Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch (_) {}
  }
}
