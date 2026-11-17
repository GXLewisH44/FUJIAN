export const DAILY_XP=50;
export function dayKey(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;
}
export function shiftDay(day,offset) {const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
export function validDay(day) {return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T00:00:00Z'))&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;}
export function dailyDone(task,day=dayKey()){return task.completions.includes(day);}
export function dailyStreak(task,day=dayKey()) {
  const days=new Set(task.completions);let cursor=days.has(day)?day:shiftDay(day,-1),n=0;
  while(days.has(cursor)){n++;cursor=shiftDay(cursor,-1);}return n;
}
export function dailyStats(tasks=[],day=dayKey()) {const done=tasks.filter(t=>dailyDone(t,day)).length;return {done,total:tasks.length,pending:tasks.length-done,checkins:tasks.reduce((n,t)=>n+t.completions.length,0)};}
export function setDailyDone(task,done,day=dayKey()) {if(!validDay(day))throw new Error('打卡日期无效');task.completions=done?[...new Set([...task.completions,day])].sort():task.completions.filter(d=>d!==day);return task;}
