import test from 'node:test';
import assert from 'node:assert/strict';
import {achievements,longestStreak} from './achievements.js';
import {dailyCopy} from './daily-copy.js';
import {shiftDay} from './daily.js';

test('new saves have 20 distinct, locked achievements and finite progress',()=>{
  const list=achievements();assert.equal(list.length,20);assert.equal(new Set(list.map(b=>b.id)).size,20);
  assert.ok(list.every(b=>!b.unlocked&&b.percent===0));
});
test('only completed tasks count toward task milestones; steps count as they happen',()=>{
  const tasks=[{type:'main',status:'active',difficulty:3,area:'科研',steps:[{done:true}]}];
  const get=id=>achievements(tasks).find(b=>b.id===id);
  assert.equal(get('main-one').unlocked,false);assert.equal(get('epic').unlocked,false);
  assert.equal(get('step-one').unlocked,true);
  tasks[0].status='done';assert.equal(get('main-one').unlocked,true);assert.equal(get('epic').unlocked,true);
  tasks[0].status='active';assert.equal(get('main-one').unlocked,false);
});
test('longest streak handles duplicates, gaps, year boundaries and old runs',()=>{
  assert.equal(longestStreak(['2025-12-31','2026-01-02','2026-01-01','2026-01-01','2026-01-05']),3);
  assert.equal(longestStreak([]),0);
  const days=Array.from({length:30},(_,i)=>shiftDay('2024-02-01',i));
  const badges=achievements([],[{completions:days}]);
  assert.equal(badges.find(b=>b.id==='streak-thirty').unlocked,true);
  assert.equal(badges.find(b=>b.id==='daily-thirty').unlocked,true);
  assert.equal(badges.find(b=>b.id==='xp-thousand').percent,100);
});
test('separate daily tasks cannot be combined into a consecutive-day streak',()=>{
  const list=achievements([],[{completions:['2026-11-01','2026-11-03']},{completions:['2026-11-02']}]);
  assert.equal(list.find(b=>b.id==='streak-three').unlocked,false);
  assert.equal(list.find(b=>b.id==='daily-seven').value,3);
});
test('daily copy is stable within a Beijing day, changes at midnight across devices',()=>{
  const a=dailyCopy(new Date('2026-11-18T00:01:00+08:00'));
  const b=dailyCopy(new Date('2026-11-18T15:59:59Z'));
  assert.deepEqual(a,b);
  const c=dailyCopy(new Date('2026-11-18T16:00:00Z'));
  assert.equal(c.day,'2026-11-19');assert.notEqual(a.quote,c.quote);
  for(const view of Object.keys(a.pages))assert.notDeepEqual(a.pages[view],c.pages[view]);
});
test('daily sayings include 14 distinct consecutive days and cover every page',()=>{
  const copies=Array.from({length:14},(_,i)=>dailyCopy(new Date(shiftDay('2026-11-01',i)+'T12:00:00+08:00')));
  assert.equal(new Set(copies.map(c=>c.quote)).size,14);
  assert.ok(copies.every(c=>Object.keys(c.pages).length===6&&c.sideNote&&c.footer&&c.dailyOpen&&c.dailyClear));
});
