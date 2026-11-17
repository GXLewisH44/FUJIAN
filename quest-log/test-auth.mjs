import test from 'node:test';
import assert from 'node:assert/strict';
const url='https://example.test/quest-log/';
async function setup(t,{session=null,hash='',responses=[]}={}){
  const values=new Map(session?[['questlog.auth.v1',JSON.stringify(session)]]:[]),calls=[],events=[],elements=new Map();
  const element=id=>{if(!elements.has(id))elements.set(id,{value:'',disabled:false,reportValidity:()=>true});return elements.get(id);};
  t.mock.method(globalThis,'setInterval',()=>0);
  t.mock.method(globalThis,'fetch',async(u,o)=>{calls.push([u,o]);const r=responses.shift();if(!r)assert.fail('Unexpected fetch: '+u);return new Response(r.body===undefined?null:JSON.stringify(r.body),{status:r.status||200});});
  const originals={};
  const env={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},document:{visibilityState:'visible',getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:()=>{}},location:{hash,origin:'https://example.test',pathname:'/quest-log/',search:''},history:{replaceState:()=>events.push('cleared-fragment')}};
  for(const [key,val] of Object.entries(env)){originals[key]=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{value:val,writable:true,configurable:true});}
  t.after(()=>{for(const key of Object.keys(env)){if(originals[key])Object.defineProperty(globalThis,key,originals[key]);else delete globalThis[key];}});
  const mod=await import('./sync.js?test='+Math.random());
  await mod.startCloud({getSave:()=>({schema:1,demo:true,tasks:[]}),replace:()=>true,canApply:()=>true,canWrite:()=>true,refresh:()=>{},toast:m=>events.push(m),confirm:async()=>true});
  await new Promise(r=>setImmediate(r));
  return {mod,values,calls,events,element};
}
const session={access_token:'test-access',refresh_token:'test-refresh',expires_at:Date.now()/1000+3600,user:{id:'a',email:'test@example.test'}};
test('logout accepts an empty HTTP 204 and removes the local session',async t=>{const f=await setup(t,{session,responses:[{body:[]},{status:204}]});f.mod.bindCloud();await f.element('cloud-logout').onclick();assert.equal(f.values.has('questlog.auth.v1'),false);assert.match(f.events.at(-1),/已退出/);assert.equal(f.calls.at(-1)[1].headers.Authorization,'Bearer test-access');});
test('expired access token refreshes before database access',async t=>{const f=await setup(t,{session:{...session,expires_at:1},responses:[{body:{...session,access_token:'new-access'}},{body:[]}]});assert.match(f.calls[0][0],/grant_type=refresh_token/);assert.equal(f.calls[1][1].headers.Authorization,'Bearer new-access');});
test('email confirmation validates the user and clears credentials from URL',async t=>{const f=await setup(t,{hash:'#access_token=confirmed&refresh_token=refresh&expires_in=3600',responses:[{body:session.user},{body:[]}]});assert.equal(f.calls[0][1].headers.Authorization,'Bearer confirmed');assert.equal(f.events[0],'cleared-fragment');assert.equal(JSON.parse(f.values.get('questlog.auth.v1')).user.id,'a');});
test('signup sends the exact return URL and does not persist the password',async t=>{const f=await setup(t,{responses:[{body:{user:session.user}}]});f.mod.bindCloud();f.element('cloud-email').value='test@example.test';f.element('cloud-password').value='fake-test-password';await f.element('cloud-signup').onclick();assert.equal(f.calls[0][0].split('redirect_to=')[1],encodeURIComponent(url));assert.equal(f.values.has('questlog.auth.v1'),false);assert.equal(f.element('cloud-password').value,'');assert.match(f.events.at(-1),/确认邮件/);});
