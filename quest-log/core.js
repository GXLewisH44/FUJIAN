export const SCHEMA = 1;
export const KEY = 'questlog.save.v1';
export const names = {active:'进行中', planned:'尚未开始', waiting:'等待中', done:'已完成'};
export function id() { return crypto.randomUUID(); }
export function dateInput(date) { const d=new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
export function xp(t) { return (t.type==='main'?300:100)*t.difficulty; }
export function progress(t) { return t.status==='done'?100:t.steps.length?Math.round(t.steps.filter(s=>s.done).length/t.steps.length*100):0; }
export function deadline(t, now=Date.now()) {
  if (!t.due) return {label:'未设 DDL',tone:'muted',days:Infinity};
  const diff=new Date(t.due).getTime()-now;
  const days=Math.ceil(diff/86400000);
  if(t.status==='done') return {label:'任务已完成',tone:'mint',days};
  if(diff<0) return {label:`逾期 ${Math.max(1,Math.ceil(-diff/86400000))} 天`,tone:'rose',days};
  if(diff<3600000) return {label:`剩余 ${Math.max(1,Math.ceil(diff/60000))} 分钟`,tone:'rose',days};
  if(diff<86400000) return {label:`剩余 ${Math.ceil(diff/3600000)} 小时`,tone:'gold',days};
  return {label:`剩余 ${days} 天`,tone:days<=3?'gold':'muted',days};
}
export function stats(tasks) {
  const done=tasks.filter(t=>t.status==='done'); const exp=done.reduce((s,t)=>s+xp(t),0);
  return {done:done.length,exp,level:Math.floor(exp/500)+1,levelXp:exp%500,active:tasks.filter(t=>t.status!=='done').length,main:tasks.filter(t=>t.type==='main'&&t.status!=='done').length,side:tasks.filter(t=>t.type==='side'&&t.status!=='done').length,soon:tasks.filter(t=>t.status!=='done'&&deadline(t).days<=3).length};
}
export function fresh(demo=false) { return {schema:SCHEMA,revision:id(),updatedAt:new Date().toISOString(),demo,tasks:[]}; }
export function demoSave() {
  const save=fresh(true); const due=(n,h=18)=>{const d=new Date();d.setDate(d.getDate()+n);d.setHours(h,0,0,0);return dateInput(d);};
  const make=(title,type,area,days,steps,done=0,extra={})=>({id:id(),title,type,area,due:due(days),priority:'normal',status:'active',difficulty:1,notes:'',reward:'',parent:'',pinned:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),completedAt:null,steps:steps.map((title,i)=>({id:id(),title,done:i<done})),...extra});
  const main=make('完成本月研究计划','main','科研',12,['梳理研究问题','完成文献阅读','搭建初版框架','写好研究计划'],2,{priority:'high',pinned:true,difficulty:2,notes:'先把最想回答的问题写清楚，每次推进一个小步骤。',reward:'给自己一个完全放松的周末'});
  save.tasks=[main,make('把运动变成生活的一部分','main','健康',25,['选定适合的运动','完成第一次训练','整理每周运动计划'],1,{reward:'一套新的运动装备'}),make('整理最近读过的文献','side','科研',1,['汇总阅读笔记','归纳三个启发'],0,{parent:main.id,pinned:true,priority:'high'}),make('预约一次牙齿检查','side','生活',3,[],0,{status:'planned'}),make('读完书架上那本书','side','成长',7,['读完剩余章节','写一句最喜欢的摘录'],1,{pinned:true}),make('整理电脑桌面','side','生活',0,[],0,{status:'done',completedAt:new Date().toISOString()})];return save;
}
export function validateSave(raw) {
  if(!raw||raw.schema!==SCHEMA||!Array.isArray(raw.tasks)||raw.tasks.length>5000)throw new Error('存档格式不正确，或版本不受支持。');
  const ids=new Set(); const clean=fresh(Boolean(raw.demo));
  clean.tasks=raw.tasks.map(t=>{
    if(!t||typeof t.id!=='string'||t.id.length>100||ids.has(t.id)||!['main','side'].includes(t.type)||!Object.hasOwn(names,t.status)||typeof t.title!=='string'||!t.title.trim()||t.title.length>120||!Array.isArray(t.steps)||t.steps.length>200||![1,2,3].includes(t.difficulty))throw new Error('存档中有无效或重复的任务。');
    ids.add(t.id); if(t.due && (typeof t.due!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t.due)||!Number.isFinite(new Date(t.due).getTime())))throw new Error('存档中的截止时间无效。');
    const str=(x,max)=>typeof x==='string'?x.slice(0,max):'';
    const time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?x:new Date().toISOString();
    const stepIds=new Set();
    return {id:t.id,title:t.title.trim(),type:t.type,status:t.status,due:t.due||'',difficulty:t.difficulty,area:str(t.area,20)||'生活',notes:str(t.notes,5000),reward:str(t.reward,150),parent:str(t.parent,100),priority:['high','normal','low'].includes(t.priority)?t.priority:'normal',pinned:Boolean(t.pinned),createdAt:time(t.createdAt),updatedAt:time(t.updatedAt),completedAt:t.status==='done'?time(t.completedAt):null,steps:t.steps.map(s=>{if(!s||typeof s.title!=='string'||s.title.length>500||!s.title.trim())throw new Error('任务步骤无效。'); const sid=typeof s.id==='string'&&s.id.length<100&&!stepIds.has(s.id)?s.id:id();stepIds.add(sid);return {id:sid,title:s.title,done:Boolean(s.done)};})};
  });
  const mainIds=new Set(clean.tasks.filter(t=>t.type==='main').map(t=>t.id));
  clean.tasks.forEach(t=>{if(t.type==='main'||!mainIds.has(t.parent))t.parent='';});
  if(clean.tasks.filter(t=>t.pinned&&t.status!=='done').length>3){let n=0;clean.tasks.forEach(t=>{if(t.pinned&&t.status!=='done'&&++n>3)t.pinned=false;});}
  return clean;
}
export function calendar(tasks) {
  const esc=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const utc=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Questlog//Life Quests//ZH','CALSCALE:GREGORIAN'];
  tasks.filter(t=>t.due&&t.status!=='done').forEach(t=>lines.push('BEGIN:VEVENT',`UID:${esc(t.id)}@questlog`,`DTSTAMP:${utc(Date.now())}`,`DTSTART:${utc(t.due)}`,`DTEND:${utc(new Date(new Date(t.due).getTime()+1800000))}`,`SUMMARY:${esc('【'+(t.type==='main'?'主线':'支线')+' DDL】'+t.title)}`,`DESCRIPTION:${esc(t.notes||'任务截止时间')}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:任务即将到期','END:VALARM','END:VEVENT'));
  lines.push('END:VCALENDAR');
  // Fold by UTF-8 bytes, as required by RFC 5545 (including the continuation space).
  return lines.map(line=>{let chunks=[],chunk='',bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>74){chunks.push(chunk);chunk=' ';bytes=1;}chunk+=char;bytes+=size;}chunks.push(chunk);return chunks.join('\r\n');}).join('\r\n')+'\r\n';
}
