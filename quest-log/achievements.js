import {stats} from './core.js?v=3';
import {shiftDay} from './daily.js?v=3';

// Use the best historical run so a missed day doesn't erase a streak milestone.
export function longestStreak(completions=[]) {
  const days=[...new Set(completions)].sort();let best=0,run=0,previous='';
  for(const day of days){run=previous&&shiftDay(previous,1)===day?run+1:1;best=Math.max(best,run);previous=day;}
  return best;
}
export function achievements(tasks=[],dailies=[]) {
  const done=tasks.filter(t=>t.status==='done'),s=stats(tasks,dailies);
  const main=done.filter(t=>t.type==='main').length,side=done.filter(t=>t.type==='side').length;
  const steps=tasks.reduce((n,t)=>n+t.steps.filter(x=>x.done).length,0);
  const checkins=dailies.reduce((n,t)=>n+new Set(t.completions).size,0);
  const streak=Math.max(0,...dailies.map(t=>longestStreak(t.completions)));
  const areas=new Set(done.map(t=>t.area)).size;
  const badge=(id,title,description,value,target,unit)=>({id,title,description,value,target,unit,unlocked:value>=target,percent:Math.min(100,Math.round(value/target*100))});
  return [
    badge('first','迈出第一步','完成第 1 个任务',done.length,1,'项'),
    badge('ten','积少成多','累计完成 10 个任务',done.length,10,'项'),
    badge('thirty','一路有收获','累计完成 30 个任务',done.length,30,'项'),
    badge('main-one','主线突破','完成 1 条主线',main,1,'条'),
    badge('main-three','翻过三座山','完成 3 条主线',main,3,'条'),
    badge('side-one','沿途发现','完成 1 个支线任务',side,1,'项'),
    badge('side-ten','生活小能手','完成 10 个支线任务',side,10,'项'),
    badge('epic','迎接挑战','完成 1 个史诗难度任务',done.filter(t=>t.difficulty===3).length,1,'项'),
    badge('step-one','从小处着手','勾选第 1 个任务步骤',steps,1,'步'),
    badge('step-twenty','一步一步来','累计完成 20 个步骤',steps,20,'步'),
    badge('step-hundred','百步成路','累计完成 100 个步骤',steps,100,'步'),
    badge('areas','生活的几种可能','在 3 个不同领域完成任务',areas,3,'个领域'),
    badge('daily-one','今日已打卡','完成第 1 次每日打卡',checkins,1,'次'),
    badge('daily-seven','点亮七次','累计完成 7 次每日打卡',checkins,7,'次'),
    badge('daily-thirty','日常的力量','累计完成 30 次每日打卡',checkins,30,'次'),
    badge('daily-hundred','百次积累','累计完成 100 次每日打卡',checkins,100,'次'),
    badge('streak-three','找到节奏','同一每日任务连续打卡 3 天',streak,3,'天'),
    badge('streak-seven','一周同行','同一每日任务连续打卡 7 天',streak,7,'天'),
    badge('streak-thirty','坚持的形状','同一每日任务连续打卡 30 天',streak,30,'天'),
    badge('xp-thousand','成长有迹可循','累计获得 1,000 XP',s.exp,1000,'XP')
  ];
}
