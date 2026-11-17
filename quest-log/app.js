import {KEY,names,id,dateInput,xp,progress,deadline,stats,fresh,demoSave,validateSave,calendar} from './core.js?v=3';
import {DAILY_XP,dayKey,shiftDay,dailyDone,dailyStreak,dailyStats,setDailyDone} from './daily.js?v=3';
import {cloudMarkup,bindCloud,cloudSummary,startCloud,localChanged} from './sync.js?v=3';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const views={all:['任务总览','冒险还在继续','把重要的事放在主线，把想尝试的事留给支线。'],main:['主线任务','向重要的事靠近','把长远目标拆成小步骤，每次推进一点。'],side:['支线任务','沿途也有好风景','生活里的小事与新尝试，也值得认真记录。'],daily:['每日任务','每天一点，也在向前','把值得坚持的小事，变成每天可以完成的冒险。'],deadline:['DDL 时间轴','把时间看清楚','按截止时间排列，先安排最需要照顾的任务。'],archive:['成就与归档','这些进度属于你','每一项完成的任务，都留下了前进的痕迹。']};
let save,storageError='',view='all',filter='all',sort='due',query='',baseRevision='',toastTimer,renderedDay='';
try{const raw=localStorage.getItem(KEY);save=raw?readSave(raw):demoSave();if(!raw)localStorage.setItem(KEY,JSON.stringify(save));baseRevision=save.revision;}catch(err){save=demoSave();storageError='存档不可用：请先导出备份';}
function readSave(raw){const data=JSON.parse(raw),clean=validateSave(data);clean.revision=typeof data.revision==='string'?data.revision:clean.revision;clean.updatedAt=data.updatedAt||clean.updatedAt;return clean;}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3800);}
function persist(next,fromCloud=false){
  try{
    const current=localStorage.getItem(KEY);
    if(current&&baseRevision&&JSON.parse(current).revision!==baseRevision)throw new Error('另一窗口已修改存档。请先关闭编辑窗口并刷新页面，再继续保存。');
    const checked=validateSave(next);checked.revision=id();checked.updatedAt=new Date().toISOString();
    localStorage.setItem(KEY,JSON.stringify(checked));save=checked;baseRevision=checked.revision;storageError='';render();if(!fromCloud)localChanged();return true;
  }catch(err){storageError=err.message||'保存失败，请先导出备份';updateSaveLabel();toast('保存未成功：'+storageError);return false;}
}
function mutate(fn){const next=structuredClone(save);fn(next);return persist(next);}
function updateSaveLabel(){const el=$('#save-state');el.textContent=storageError?'● 保存未成功':cloudSummary()||'● 此设备已保存';el.classList.toggle('warning',Boolean(storageError));el.title=storageError||'修改先保存在此浏览器；打开“存档与同步”登录后可自动同步和备份';}
function dateLabel(value,full=false){if(!value)return '未设 DDL';return new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',...(full?{year:'numeric'}:{})}).format(new Date(value));}
function ordered(tasks){return [...tasks].sort((a,b)=>sort==='priority'?({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority]||dueSort(a,b)):sort==='updated'?new Date(b.updatedAt)-new Date(a.updatedAt):dueSort(a,b));}
function dueSort(a,b){return (a.due?new Date(a.due).getTime():Infinity)-(b.due?new Date(b.due).getTime():Infinity)||a.title.localeCompare(b.title,'zh-CN');}
function confirmAction(title,text,action='确认') {return new Promise(resolve=>{const d=$('#confirm-dialog');$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;$('#confirm-ok').textContent=action;let finish=value=>{d.close();resolve(value);};$('#confirm-ok').onclick=()=>finish(true);$('#confirm-cancel').onclick=()=>finish(false);d.oncancel=e=>{e.preventDefault();finish(false);};d.showModal();});}
function render(){
  renderedDay=dayKey();
  const s=stats(save.tasks,save.dailies),v=views[view];
  $('#page-crumb').textContent=v[0];$('#page-title').innerHTML=E(v[1])+'<span class="heading-star">✦</span>';$('#page-description').textContent=v[2];
  $('#today-label').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date())+' / YOUR ADVENTURE LOG';
  $('#demo-banner').hidden=!save.demo;$('#nav-main').textContent=s.main;$('#nav-side').textContent=s.side;$('#nav-dot').hidden=!s.soon;
  $('#nav-daily').textContent=dailyStats(save.dailies).pending;$('#top-new').dataset.new=view==='daily'?'daily':view==='main'?'main':'side';
  $$('#nav [data-view]').forEach(el=>{el.classList.toggle('active',el.dataset.view===view);el.setAttribute('aria-current',el.dataset.view===view?'page':'false');});
  $('#side-level').textContent=`Lv. ${s.level} · ${rank(s.level)}`;
  $('#stats').innerHTML=[['sword','进行中的主线',s.main,'MAIN QUESTS'],['spark','待完成的支线',s.side,'SIDE QUESTS'],['clock','三天内 / 已逾期',s.soon,'TIME SENSITIVE'],['cup','已完成任务',s.done,'QUESTS CLEARED']].map(([i,l,n,h])=>`<div class="stat"><span class="stat-icon">${icon(i)}</span><div><label>${l}</label><b>${n.toString().padStart(2,'0')}</b><small>${h}</small></div></div>`).join('');
  renderHero();renderContent();renderRail();updateSaveLabel();
}
function rank(level){return level<3?'初来乍到':level<6?'渐入佳境':level<10?'稳步前行':'自己的传奇';}
function renderHero(){
  if(!['all','main'].includes(view)){$('#hero').innerHTML='';return;}
  const t=ordered(save.tasks.filter(t=>t.type==='main'&&t.status!=='done')).sort((a,b)=>Number(b.pinned)-Number(a.pinned))[0];
  if(!t){$('#hero').innerHTML=`<div class="hero"><div class="hero-top"><span class="pill">${icon('sword')} YOUR NEXT CHAPTER</span><span class="hero-id">A NEW ADVENTURE AWAITS</span></div><h2>你的下一条主线，是什么？</h2><p>工作、研究、健康，或是一直想完成的心愿。为重要的事情留一个位置。</p><div class="hero-bottom"><span class="eyebrow">ONE SMALL STEP AT A TIME</span><button class="button primary small" data-new="main">${icon('plus')}开启主线</button></div><div class="hero-mark">${icon('compass')}</div></div>`;return;}
  const p=progress(t);$('#hero').innerHTML=`<div class="hero"><div class="hero-top"><span class="pill">${icon('sword')} 当前主线 · ${E(t.area)}</span><span class="hero-id">MAIN QUEST / IN PROGRESS</span></div><h2>${E(t.title)}</h2><p>${E(t.notes||'把一个大目标，变成今天可以推进的一小步。')}</p><div class="hero-bottom"><div class="hero-progress"><div class="progress-label"><span>已完成 ${t.steps.filter(s=>s.done).length} / ${t.steps.length} 个步骤</span><b>${p}%</b></div><div class="track"><span style="width:${p}%"></span></div></div><button class="button ghost" data-edit="${E(t.id)}">继续冒险 ${icon('arrow')}</button></div><div class="hero-mark">${icon('sword')}</div></div>`;
}
function card(t){
  const d=deadline(t),p=progress(t),parent=save.tasks.find(x=>x.id===t.parent);
  return `<article class="quest-card ${t.type==='main'?'main-quest':''} ${t.status==='done'?'done':''}" data-task="${E(t.id)}"><div class="quest-card-top"><button class="quest-check" data-complete="${E(t.id)}" aria-label="${t.status==='done'?'重新开启':'完成'}：${E(t.title)}" title="${t.status==='done'?'重新开启任务':'标记完成'}">${t.status==='done'?icon('check'):''}</button><div class="quest-main"><button class="quest-title" data-edit="${E(t.id)}">${E(t.title)}</button><div class="quest-meta"><span class="tag ${t.type}">${t.type==='main'?'主线':'支线'}</span><span>${E(t.area)}</span><span class="meta-sep">/</span><span>${names[t.status]}</span>${t.priority==='high'?'<span class="tag high">高优先级</span>':''}<span class="meta-sep">·</span><span class="quest-deadline ${d.tone}" title="${E(dateLabel(t.due,true))}">${icon('clock')}${E(d.label)}</span>${t.due?`<span>${E(dateLabel(t.due))}</span>`:''}</div></div><div class="quest-tools"><span class="xp">+${xp(t)} XP</span>${t.status!=='done'?`<button class="pin ${t.pinned?'on':''}" data-pin="${E(t.id)}" aria-label="${t.pinned?'移出':'加入'}今日聚焦：${E(t.title)}" title="${t.pinned?'移出今日聚焦':'加入今日聚焦'}">${icon('pin')}</button>`:''}</div></div>${t.steps.length?`<div class="quest-progress"><div class="track"><span style="width:${p}%"></span></div><span>${t.steps.filter(s=>s.done).length}/${t.steps.length}</span></div><div class="step-list">${t.steps.map(s=>`<label class="step-row ${s.done?'checked':''}"><input type="checkbox" data-step="${E(s.id)}" data-owner="${E(t.id)}" ${s.done?'checked':''} ${t.status==='done'?'disabled':''}><span>${E(s.title)}</span></label>`).join('')}</div>`:''}${parent?`<div class="parent-note">↳ 关联主线：${E(parent.title)}</div>`:''}</article>`;
}
function empty(title,copy,button=true){return `<div class="empty">${icon('compass')}<h3>${E(title)}</h3><p>${E(copy)}</p>${button?`<button class="button primary small" data-new="${view==='main'?'main':'side'}">${icon('plus')}接取一个任务</button>`:''}</div>`;}
function renderContent(){
  if(view==='daily'){renderDaily();return;}
  if(view==='deadline'){renderTimeline();return;}
  if(view==='archive'){renderArchive();return;}
  const type=view==='all'?filter:view;
  $('#view-content').innerHTML=`<div class="section-head"><h2>我的任务 <small>QUEST JOURNAL</small></h2><button class="text-button" data-new="${view==='main'?'main':'side'}">＋ 接取新任务</button></div><div class="toolbar"><div class="tabs" role="group" aria-label="任务类型">${[['all','全部'],['main','主线'],['side','支线']].map(([v,l])=>`<button class="tab ${v===type?'active':''}" data-filter="${v}" aria-pressed="${v===type}">${l}</button>`).join('')}</div><select class="sort" id="sort" aria-label="任务排序"><option value="due">按 DDL 先后排序</option><option value="priority">按重要程度排序</option><option value="updated">按最近修改排序</option></select></div><label class="search">${icon('search')}<input id="search" placeholder="搜索任务、领域或说明…" value="${E(query)}" aria-label="搜索任务"></label><div id="task-list"></div>`;
  $('#sort').value=sort;$('#sort').onchange=e=>{sort=e.target.value;renderList();};$('#search').oninput=e=>{query=e.target.value;renderList();};renderList();
  if(view==='all')$('#view-content').insertAdjacentHTML('afterbegin',dailyOverview());
}
function dailyOverview(){const s=dailyStats(save.dailies);return `<section class="daily-overview"><div class="daily-overview-icon">${icon('sun')}</div><div><h3>每日任务 <span>${s.done} / ${s.total}</span></h3><p>${s.total?s.pending?`今天还有 ${s.pending} 件小事，等你点亮。`:'今天的每日任务全部完成，明天继续。':'给阅读、运动或每日计划留一个位置。'}</p></div><button class="button small" data-view="daily">${s.total?'去打卡':'添加每日任务'} ${icon('arrow')}</button></section>`;}
function dailyCard(t,today){
  const done=dailyDone(t,today),streak=dailyStreak(t,today);
  const week=Array.from({length:7},(_,i)=>shiftDay(today,i-6));
  return `<article class="quest-card daily-card ${done?'daily-complete':''}"><div class="quest-card-top"><button class="quest-check" data-daily-check="${E(t.id)}" aria-label="${done?'取消今日打卡':'完成今日打卡'}：${E(t.title)}" aria-pressed="${done}">${done?icon('check'):''}</button><div class="quest-main"><button class="quest-title" data-daily-edit="${E(t.id)}">${E(t.title)}</button><div class="quest-meta"><span class="tag daily">每日</span><span>${E(t.area)}</span><span class="meta-sep">·</span><span class="${done?'mint':'muted'}">${done?'今日已完成':'今日待完成'}</span></div>${t.notes?`<p class="daily-notes">${E(t.notes)}</p>`:''}</div><span class="xp">+${DAILY_XP} XP</span></div><div class="daily-record"><div class="daily-streak"><b>${streak}</b> 天连续 <span>累计 ${t.completions.length} 次</span></div><div class="daily-week" aria-label="近七天打卡记录">${week.map(day=>`<span class="daily-day ${dailyDone(t,day)?'checked':''} ${day===today?'today':''}" title="${day} ${dailyDone(t,day)?'已打卡':'未打卡'}" aria-label="${day} ${dailyDone(t,day)?'已打卡':'未打卡'}"><small>${day===today?'今':Number(day.slice(-2))}</small><i>${dailyDone(t,day)?'✓':'·'}</i></span>`).join('')}</div></div></article>`;
}
function renderDaily(){
  const today=dayKey(),s=dailyStats(save.dailies,today),percent=s.total?Math.round(s.done/s.total*100):0;
  const tasks=[...save.dailies].sort((a,b)=>Number(dailyDone(a,today))-Number(dailyDone(b,today)));
  $('#view-content').innerHTML=`<section class="daily-hero"><div class="daily-hero-heading"><span class="pill">${icon('sun')} DAILY QUESTS</span><span class="eyebrow">${today.replaceAll('-',' / ')}</span></div><h2>${s.total&&s.done===s.total?'今日全清，做得不错。':'今天，也为自己积累一点。'}</h2><p>北京时间 00:00 开启新一天 · 历史打卡与经验保留</p><div class="daily-progress-label"><span>今日完成 <b>${s.done} / ${s.total}</b></span><span>今日获得 <b>${s.done*DAILY_XP} XP</b></span></div><div class="track"><span style="width:${percent}%"></span></div></section><div class="section-head"><h2>我的每日任务 <small>ONE DAY AT A TIME</small></h2><button class="text-button" data-new="daily">＋ 添加每日任务</button></div>${tasks.length?tasks.map(t=>dailyCard(t,today)).join(''):`<div class="empty daily-empty">${icon('sun')}<h3>从一件容易坚持的小事开始</h3><p>任务每天自动出现，点击圆圈即可完成今日打卡。</p><button class="button primary small" data-new="daily">${icon('plus')}添加每日任务</button><div class="daily-suggestions">${['阅读 20 分钟','运动 15 分钟','整理今日计划'].map(title=>`<button class="button small" data-daily-preset="${title}">${title}</button>`).join('')}</div></div>`}<p class="archive-tip">每项每天可获得 ${DAILY_XP} XP。误点可以取消，重复勾选不会重复加经验；今天没完成也不会扣分。</p>`;
}
function openDaily(taskId,preset=''){
  const task=save.dailies.find(t=>t.id===taskId);$('#daily-form').reset();$('#daily-id').value=task?.id||'';$('#daily-dialog-title').textContent=task?'编辑每日任务':'接取每日任务';$('#daily-title').value=task?.title||preset;$('#daily-area').value=task?.area||'生活';$('#daily-notes').value=task?.notes||'';$('#delete-daily').hidden=!task;$('#daily-dialog').showModal();
}
$('#daily-form').onsubmit=e=>{e.preventDefault();const title=$('#daily-title').value.trim();if(!title){$('#daily-title').focus();return;}const existing=save.dailies.find(t=>t.id===$('#daily-id').value),now=new Date().toISOString();const task={id:existing?.id||id(),title,area:$('#daily-area').value,notes:$('#daily-notes').value,createdAt:existing?.createdAt||now,updatedAt:now,completions:existing?.completions||[]};if(mutate(s=>{s.dailies=existing?s.dailies.map(t=>t.id===existing.id?task:t):[...s.dailies,task];})){$('#daily-dialog').close();toast('每日任务已保存，明天也会在这里。');}};
$('#delete-daily').onclick=async()=>{const taskId=$('#daily-id').value;if(await confirmAction('删除这个每日任务？','会同时删除它的历史打卡记录，对应经验也会重新计算。可先在“存档与同步”中导出备份。','删除每日任务')){if(mutate(s=>{s.dailies=s.dailies.filter(t=>t.id!==taskId);})){$('#daily-dialog').close();toast('每日任务已删除。');}}};
function checkDaily(taskId){const t=save.dailies.find(t=>t.id===taskId);if(!t)return;const today=dayKey(),done=dailyDone(t,today);if(mutate(s=>{const task=s.dailies.find(t=>t.id===taskId);setDailyDone(task,!done,today);task.updatedAt=new Date().toISOString();})){toast(done?'已取消今日打卡，对应经验已扣回。':`✦ 今日打卡完成！+${DAILY_XP} XP`);}}
function renderList(){
  const type=view==='all'?filter:view;
  const tasks=ordered(save.tasks.filter(t=>t.status!=='done'&&(type==='all'||t.type===type)&&[t.title,t.area,t.notes].join(' ').toLowerCase().includes(query.toLowerCase())));
  $('#task-list').innerHTML=tasks.length?tasks.map(card).join('')+`<button class="add-card" data-new="${view==='main'?'main':'side'}">${icon('plus')}把下一件想做的事，放进任务日志</button>`:empty(query?'暂时没有匹配的任务':'这里正在等待新的故事',query?'试试其他关键词，或查看其他任务类型。':'点击接取任务，写下你想推进的第一件事。',!query);
}
function renderTimeline(){
  const tasks=ordered(save.tasks.filter(t=>t.status!=='done'&&t.due)).sort(dueSort),groups=new Map();
  tasks.forEach(t=>{const d=deadline(t);const group=d.tone==='rose'&&new Date(t.due)<Date.now()?'已经逾期 · 重新安排也没关系':d.days<=3?'未来三天 · 优先照顾':d.days<=7?'未来一周':'更远的计划';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(t);});
  $('#view-content').innerHTML=`<div class="section-head"><h2>任务截止时间 <small>DEADLINE MAP</small></h2><button class="text-button" id="calendar-inline">↓ 导出日历</button></div>${tasks.length?[...groups].map(([name,ts])=>`<section class="deadline-group"><h3>${name} <span class="muted">/ ${ts.length}</span></h3>${ts.map(card).join('')}</section>`).join(''):empty('时间轴暂时空着','给任务设置 DDL 后，会自动出现在这里。')}<div class="archive-tip">另有 ${save.tasks.filter(t=>t.status!=='done'&&!t.due).length} 项未设置 DDL 的任务，不出现在时间轴中。逾期不会扣经验值。</div>`;
  $('#calendar-inline').onclick=exportCalendar;
}
function renderArchive(){
  const s=stats(save.tasks,save.dailies),done=save.tasks.filter(t=>t.status==='done').sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt));
  const badges=[['冒险的第一步','完成第 1 个任务',s.done>=1],['主线突破','完成 1 条主线',done.some(t=>t.type==='main')],['积少成多','累计完成 10 个任务',s.done>=10]];
  $('#view-content').innerHTML=`<div class="section-head"><h2>冒险成就 <small>YOUR MILESTONES</small></h2></div><div class="achievement-grid">${badges.map(([a,b,c])=>`<div class="achievement ${c?'unlocked':''}">${icon('cup')}<b>${a}</b><small>${c?'已解锁 · ':''}${b}</small></div>`).join('')}</div><div class="section-head"><h2>已经完成的故事 <small>${done.length} CLEARED</small></h2></div><p class="archive-tip">点选已完成任务的勾号，可以重新开启；对应经验值会重新计算，重复开关不会刷经验。</p>${done.length?done.map(card).join(''):empty('你的成就正在路上','完成第一个任务，就会在这里留下记录。',false)}`;
}
function renderRail(){
  const s=stats(save.tasks,save.dailies),focus=save.tasks.filter(t=>t.pinned&&t.status!=='done'),soon=save.tasks.filter(t=>t.due&&t.status!=='done').sort(dueSort).slice(0,3);
  $('#right-rail').innerHTML=`<section class="panel"><div><h3>冒险者档案</h3><div class="panel-kicker">A LITTLE BETTER EVERY DAY</div></div><div class="adventurer"><div class="crest">${icon('compass')}</div><div><strong>Lv. ${String(s.level).padStart(2,'0')}</strong><small>${rank(s.level)} · 自由冒险者</small></div></div><div class="level-track"><div class="track"><span style="width:${s.levelXp/5}%"></span></div><div class="level-copy"><span>${s.levelXp} / 500 XP</span><span>距离升级 ${500-s.levelXp} XP</span></div></div><p class="level-tip">累计获得 ${s.exp} XP。完成主线获得 300 基础经验，支线获得 100，按难度翻倍；每日打卡每次获得 50 XP。</p></section><section class="panel"><div class="panel-heading"><h3>今日聚焦</h3><span class="focus-count">${focus.length} / 3</span></div>${focus.length?focus.map((t,i)=>`<div class="focus-item"><span>0${i+1}</span><div><button data-edit="${E(t.id)}">${E(t.title)}</button><small>${t.type==='main'?'主线':'支线'} · ${E(deadline(t).label)}</small></div></div>`).join(''):'<p class="focus-help">点击任务旁的图钉，挑选今天最想推进的事。最多三项，给注意力留一点空间。</p>'}</section><section class="panel deadline-panel"><div class="panel-heading"><h3>接下来的 DDL</h3>${icon('clock')}</div><div class="timeline-list">${soon.length?soon.map(t=>`<div class="time-item"><span class="time-dot"></span><div><div class="time-date">${E(dateLabel(t.due))}</div><button data-edit="${E(t.id)}">${E(t.title)}</button><small class="${deadline(t).tone}">${E(deadline(t).label)}</small></div></div>`).join(''):'<p class="focus-help">暂时没有需要赶上的截止时间。</p>'}</div></section><div class="quote-card"><span>✧</span><p>不用同时成为所有故事的主角。<br>先走好你现在的这一条主线。</p><small>THIS IS YOUR OWN ADVENTURE.</small></div>`;
}
function openEditor(taskId,type='side'){
  const t=save.tasks.find(x=>x.id===taskId);$('#task-form').reset();$('#task-id').value=t?.id||'';$('#task-dialog-title').textContent=t?'任务详情与进度':'接取一个新任务';
  $('#task-title').value=t?.title||'';$('#task-type').value=t?.type||type;$('#task-area').value=t?.area||'生活';$('#task-due').value=t?.due||'';$('#task-priority').value=t?.priority||'normal';$('#task-status').value=t?.status||'active';$('#task-difficulty').value=t?.difficulty||1;$('#task-notes').value=t?.notes||'';$('#task-reward').value=t?.reward||'';$('#task-steps').value=t?.steps.map(s=>s.title).join('\n')||'';
  $('#task-parent').innerHTML='<option value="">独立支线，不关联主线</option>'+save.tasks.filter(x=>x.type==='main'&&x.id!==t?.id).map(x=>`<option value="${E(x.id)}">${E(x.title)}</option>`).join('');$('#task-parent').value=t?.parent||'';$('#parent-field').hidden=$('#task-type').value==='main';$('#delete-task').hidden=!t;$('#task-dialog').showModal();
}
$('#task-type').onchange=()=>{$('#parent-field').hidden=$('#task-type').value==='main';};
$('#task-form').onsubmit=e=>{
  e.preventDefault();const existing=save.tasks.find(t=>t.id===$('#task-id').value);const title=$('#task-title').value.trim();if(!title){$('#task-title').focus();return;}
  const now=new Date().toISOString(),type=$('#task-type').value,status=$('#task-status').value,lines=$('#task-steps').value.split('\n').map(x=>x.trim()).filter(Boolean);
  if(lines.length>200||lines.some(l=>l.length>500)){toast('最多 200 个步骤，每个步骤不超过 500 字。');return;}
  const oldSteps=[...(existing?.steps||[])];const steps=lines.map(title=>{const n=oldSteps.findIndex(s=>s.title===title);return n>=0?oldSteps.splice(n,1)[0]:{id:id(),title,done:false};});
  const task={id:existing?.id||id(),title,type,area:$('#task-area').value,due:$('#task-due').value,priority:$('#task-priority').value,status,difficulty:Number($('#task-difficulty').value),notes:$('#task-notes').value,reward:$('#task-reward').value,parent:type==='side'?$('#task-parent').value:'',steps,pinned:existing?.pinned||false,createdAt:existing?.createdAt||now,updatedAt:now,completedAt:status==='done'?(existing?.completedAt||now):null};
  if(status==='done')steps.forEach(step=>step.done=true);
  if(persist({...save,tasks:existing?save.tasks.map(t=>t.id===existing.id?task:t):[...save.tasks,task]})){$('#task-dialog').close();toast(status==='done'&&existing?.status!=='done'?`任务完成！获得 ${xp(task)} XP${task.reward?' · 奖励：'+task.reward:''}`:'任务已保存，冒险继续。');}
};
$('#delete-task').onclick=async()=>{const taskId=$('#task-id').value;if(await confirmAction('放下这个任务？','删除后无法撤销。关联的支线会保留，经验值会按现存的已完成任务重新计算。','删除任务')){if(mutate(s=>{s.tasks=s.tasks.filter(t=>t.id!==taskId);s.tasks.forEach(t=>{if(t.parent===taskId)t.parent='';});})){$('#task-dialog').close();toast('任务已删除。');}}};
async function toggleComplete(taskId){const t=save.tasks.find(t=>t.id===taskId);if(!t)return;const done=t.status==='done';if(!done&&t.steps.some(s=>!s.done)&&!await confirmAction('还有步骤没勾选','你可以直接完成整个任务，小步骤也会一并完成。','完成整个任务'))return;
  if(mutate(s=>{const task=s.tasks.find(t=>t.id===taskId);task.status=done?'active':'done';task.completedAt=done?null:new Date().toISOString();task.updatedAt=new Date().toISOString();if(!done)task.steps.forEach(step=>step.done=true);})){toast(done?'任务已重新开启。':`✦ 任务完成！+${xp(t)} XP${t.reward?' · 奖励：'+t.reward:''}`);}
}
function pinTask(taskId){const t=save.tasks.find(t=>t.id===taskId);if(!t)return;if(!t.pinned&&save.tasks.filter(t=>t.pinned&&t.status!=='done').length>=3){toast('今日聚焦最多三项，先移出一项再加入吧。');return;}mutate(s=>{const task=s.tasks.find(t=>t.id===taskId);task.pinned=!task.pinned;task.updatedAt=new Date().toISOString();});}
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.hasAttribute('data-new')){if(el.dataset.new==='daily')openDaily();else openEditor(null,el.dataset.new);}else if(el.dataset.dailyCheck)checkDaily(el.dataset.dailyCheck);else if(el.dataset.dailyEdit)openDaily(el.dataset.dailyEdit);else if(el.dataset.dailyPreset)openDaily(null,el.dataset.dailyPreset);else if(el.dataset.edit)openEditor(el.dataset.edit);else if(el.dataset.complete)toggleComplete(el.dataset.complete);else if(el.dataset.pin)pinTask(el.dataset.pin);else if(el.hasAttribute('data-close'))el.closest('dialog').close();else if(el.dataset.view){view=el.dataset.view;query='';render();window.scrollTo({top:0,behavior:'smooth'});}else if(el.dataset.filter){filter=el.dataset.filter;if(view!=='all'){view=filter==='all'?'all':filter;}render();}});
document.addEventListener('change',e=>{if(e.target.dataset.step){const owner=e.target.dataset.owner,stepId=e.target.dataset.step;mutate(s=>{const t=s.tasks.find(t=>t.id===owner);t.steps.find(x=>x.id===stepId).done=e.target.checked;t.updatedAt=new Date().toISOString();});}});
$('#start-own').onclick=async()=>{if(await confirmAction('开启属于你的存档','将清空当前示例任务，经验与等级从零开始。你可以先在“存档与同步”里导出示例。','开启我的冒险')){if(persist(fresh(false))){toast('新篇章已经开启。');openEditor(null,'main');}}};
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
$('#export-btn').onclick=()=>{download(JSON.stringify(save,null,2),`questlog-${dateInput(new Date()).slice(0,10)}.json`,'application/json');toast('存档已导出，记得妥善保存。');};
$('#import-btn').onclick=()=>$('#import-file').click();$('#import-file').onchange=async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>10*1024*1024){toast('存档文件不能超过 10MB。');return;}try{const imported=validateSave(JSON.parse(await file.text()));if(await confirmAction('导入这份存档？',`包含 ${imported.tasks.length} 个主支线任务、${imported.dailies.length} 个每日任务。导入将替换此设备的现有存档，请确认已经备份。`,'导入并替换')){if(persist(imported)){$('#storage-dialog').close();toast('存档导入成功。');}}}catch(err){toast('导入失败：'+err.message);}};
function exportCalendar(){if(!save.tasks.some(t=>t.due&&t.status!=='done')){toast('还没有设置截止时间的未完成任务。');return;}download(calendar(save.tasks),'questlog-deadlines.ics','text/calendar;charset=utf-8');toast('日历文件已导出，请导入你的日历应用。');}
$('#calendar-btn').onclick=exportCalendar;
function refreshCloud(force=false){updateSaveLabel();if($('#storage-dialog').open){if(force||!$('#cloud-auth')||!$('#cloud-auth').contains(document.activeElement)){$('#cloud-panel').innerHTML=cloudMarkup();bindCloud();}}}
function openStorage(){$('#cloud-panel').innerHTML=cloudMarkup();bindCloud();$('#storage-dialog').showModal();}
$('#storage-btn').onclick=openStorage;const mobileStorage=document.createElement('button');mobileStorage.className='button storage-mobile-button';mobileStorage.setAttribute('aria-label','存档与同步');mobileStorage.title='存档与同步';mobileStorage.innerHTML=icon('cloud');mobileStorage.onclick=openStorage;document.body.append(mobileStorage);
window.addEventListener('storage',e=>{if(e.key!==KEY)return;if($$('dialog[open]').length){storageError='另一窗口已更新，请先关闭编辑窗口并刷新';updateSaveLabel();toast('另一窗口已更新存档，当前编辑不会自动覆盖它。');return;}try{if(e.newValue){save=readSave(e.newValue);baseRevision=save.revision;render();toast('已载入另一窗口的最新进度。');}}catch{toast('另一窗口的存档无法读取，请导出当前进度。');}});
setInterval(()=>{if(!$$('dialog[open]').length&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))render();},60000);
function refreshDay(){if(document.visibilityState==='visible'&&renderedDay!==dayKey()&&!$$('dialog[open]').length)render();}
window.addEventListener('focus',refreshDay);document.addEventListener('visibilitychange',refreshDay);
render();
startCloud({getSave:()=>save,replace:next=>persist(next,true),canWrite:()=>!storageError&&JSON.parse(localStorage.getItem(KEY)||'null')?.revision===baseRevision,canApply:()=>!$('#task-dialog').open&&!$('#daily-dialog').open&&!$('#confirm-dialog').open&&!storageError&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName),toast,confirm:confirmAction,refresh:refreshCloud});

