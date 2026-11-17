import {cloudConfig as config} from './config.js?v=2';
import {validateSave} from './core.js?v=3';
import {createSyncEngine} from './sync-engine.js?v=3';
const AUTH='questlog.auth.v1', META='questlog.sync-meta.v2';
export const cloudAvailable=Boolean(config.url&&config.publishableKey);
let session=null,engine=null,hooks=null,refreshing=null,timer,authBusy=false,state='local',message='',lastSynced='';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stored(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
session=stored(AUTH);
export function cloudSummary(){return session?.user?'● '+(message||'正在连接云端…'):cloudAvailable?'● 此设备已保存 · 登录可同步':'';}
export function cloudMarkup(){
  if(!cloudAvailable)return '<div class="storage-section"><h3>此设备存档</h3><p>云端暂未配置，可以导出和导入存档。</p></div>';
  if(session?.user)return `<div class="storage-section"><div class="sync-badge" role="status">● ${esc(message||'正在连接云端…')}</div><h3>${esc(session.user.email)}</h3><p>修改会先保存到此设备，再自动同步。打开页面期间每 20 秒检查另一设备的进度，回到页面时也会检查。离线修改会在网络恢复后重试。</p>${state==='conflict'?'<p class="rose">当前两份进度不同。请先导出本机备份，再选择保留哪份。</p>':''}<p>${lastSynced?'最近成功同步：'+esc(lastSynced):'示例任务不会上传，建立个人存档后即可开始。'}</p><div class="button-row"><button class="button primary" id="cloud-sync">立即同步</button><button class="button" id="cloud-pull">↓ 用云端替换本机</button><button class="button" id="cloud-push">↑ 用本机替换云端</button><button class="text-button" id="cloud-logout">退出账号</button></div></div>`;
  return '<div class="storage-section"><div class="sync-badge">● 登录后自动同步私人存档</div><h3>继续同一场冒险</h3><p>在这里注册任务局账号，手机和电脑使用同一邮箱登录。这与 Supabase 控制台账号独立。注册后请先打开邮箱确认邮件。</p><form id="cloud-auth"><label>邮箱<input type="email" id="cloud-email" required autocomplete="email" maxlength="254"></label><label>密码<input type="password" id="cloud-password" required minlength="8" autocomplete="current-password" maxlength="128"></label><div class="button-row"><button class="button primary" type="submit">登录</button><button class="button" type="button" id="cloud-signup">注册</button></div></form></div>';
}
function notify(next,text){state=next;message=text;if(next==='synced')lastSynced=new Date().toLocaleString('zh-CN');hooks?.refresh();}
function saveSession(data){session={...data,expires_at:data.expires_at||(Date.now()/1000+(data.expires_in||3600))};localStorage.setItem(AUTH,JSON.stringify(session));}
async function request(path,{method='GET',body,token}={}){
  let response;
  try{response=await fetch(config.url+path,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});}catch{throw new Error('暂时无法联网，修改已保存在此设备');}
  const text=await response.text();let data;try{data=text?JSON.parse(text):null;}catch{throw new Error('云端返回异常，请稍后重试');}
  if(!response.ok){const raw=data?.msg||data?.message||data?.error_description||data?.error||'云端操作失败';const errors={invalid_credentials:'邮箱或密码不正确',email_not_confirmed:'请先前往邮箱确认注册邮件',over_email_send_rate_limit:'确认邮件发送过于频繁，请稍后再试',email_address_not_authorized:'当前邮件服务仅支持项目所属邮箱，请使用创建项目的邮箱注册'};throw new Error(errors[data?.error_code||data?.code]||raw);}
  return data;
}
async function call(path,options={}){
  const original=session;
  if(!original?.user)throw new Error('请先登录任务局账号');
  if(original.expires_at*1000<Date.now()+60000){
    if(!refreshing){refreshing=request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:original.refresh_token}}).then(data=>{if(session===original)saveSession(data);}).finally(()=>{refreshing=null;});}
    try{await refreshing;}catch{throw new Error('登录已过期，请退出后重新登录；本机存档保留');}
  }
  if(session?.user?.id!==original.user.id)throw new Error('账号已变化，请重新操作');
  return request(path,{...options,token:session.access_token});
}
function connect(){
  engine?.stop();engine=null;
  if(!session?.user||!hooks)return;
  engine=createSyncEngine({uid:session.user.id,getSave:hooks.getSave,canApply:hooks.canApply,canWrite:hooks.canWrite,replace:next=>hooks.replace(validateSave(next)),getMeta:()=>stored(META),setMeta:meta=>localStorage.setItem(META,JSON.stringify(meta)),status:notify,
    readRemote:async()=>{const rows=await call('/rest/v1/questlog_saves?select=version,payload');return rows[0]?{version:rows[0].version,payload:validateSave(rows[0].payload)}:null;},
    writeRemote:(version,snapshot)=>call('/rest/v1/rpc/questlog_write',{method:'POST',body:{p_expected:version,p_snapshot:snapshot}})});
  engine.sync();
}
export function localChanged(){if(!engine)return;notify('pending','修改已保存在本机 · 等待同步');clearTimeout(timer);timer=setTimeout(()=>engine?.sync(),900);}
export async function startCloud(h){
  hooks=h;if(!cloudAvailable)return;
  const fragment=new URLSearchParams(location.hash.slice(1));
  if(fragment.has('access_token')){
    const token=fragment.get('access_token');history.replaceState(null,'',location.pathname+location.search);
    try{const user=await request('/auth/v1/user',{token});saveSession({access_token:token,refresh_token:fragment.get('refresh_token'),expires_in:Number(fragment.get('expires_in'))||3600,user});hooks.toast('邮箱确认成功，已登录任务局');}catch(e){hooks.toast(e.message);}
  }else if(fragment.has('error_description')){hooks.toast(fragment.get('error_description'));history.replaceState(null,'',location.pathname+location.search);}
  connect();hooks.refresh();
  const retry=()=>{if(document.visibilityState==='visible')engine?.sync();};
  setInterval(retry,20000);window.addEventListener('online',retry);window.addEventListener('focus',retry);document.addEventListener('visibilitychange',retry);
  window.addEventListener('storage',e=>{if(e.key===AUTH){const next=stored(AUTH);if(next?.user?.id!==session?.user?.id){session=next;message='';connect();hooks.refresh();}else session=next;}});
}
export function bindCloud(){
  if(!cloudAvailable||!hooks)return;
  const byId=s=>document.getElementById(s);
  const run=async fn=>{if(authBusy||engine?.busy){hooks.toast('正在同步，请稍后再试');return;}authBusy=true;document.querySelectorAll('#cloud-panel button').forEach(b=>b.disabled=true);try{await fn();}catch(e){hooks.toast(e.message);}finally{authBusy=false;document.querySelectorAll('#cloud-panel button').forEach(b=>b.disabled=false);hooks.refresh(true);}};
  if(!session?.user){
    const auth=signup=>run(async()=>{if(!byId('cloud-auth').reportValidity())return;const email=byId('cloud-email').value.trim(),password=byId('cloud-password').value;const redirect=location.origin+location.pathname;const data=await request(signup?'/auth/v1/signup?redirect_to='+encodeURIComponent(redirect):'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});byId('cloud-password').value='';if(data.access_token){saveSession(data);hooks.toast('已登录，正在同步存档');connect();}else hooks.toast('请打开邮箱中的确认邮件，再回来登录；也请检查垃圾邮件。');});
    byId('cloud-auth').onsubmit=e=>{e.preventDefault();auth(false);};byId('cloud-signup').onclick=()=>auth(true);return;
  }
  byId('cloud-sync').onclick=()=>run(()=>engine?.sync());
  byId('cloud-pull').onclick=()=>run(async()=>{if(await hooks.confirm('用云端存档替换此设备？','本机尚未上传的修改会被替换。建议先导出备份。','读取并替换'))await engine.sync('pull');});
  byId('cloud-push').onclick=()=>run(async()=>{if(await hooks.confirm('用本机存档替换云端？','云端现有进度将被这份存档替换，其他设备随后也会读取它。建议先备份两份存档。','上传并替换'))await engine.sync('push');});
  byId('cloud-logout').onclick=()=>run(async()=>{engine?.stop();engine=null;try{await call('/auth/v1/logout?scope=local',{method:'POST'});}catch{}session=null;localStorage.removeItem(AUTH);message='';lastSynced='';hooks.toast('已退出，此设备存档保留');});
}
