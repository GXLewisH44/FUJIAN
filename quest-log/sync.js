import {cloudConfig as config} from './config.js';
import {validateSave} from './core.js';
const AUTH='questlog.auth.v1', VERSION='questlog.cloud-version.v1';
export const cloudAvailable=Boolean(config.url&&config.publishableKey);
let session=null,version=null,busy=false,lastSynced='';
try{session=JSON.parse(localStorage.getItem(AUTH)||'null');const v=JSON.parse(localStorage.getItem(VERSION)||'null');if(v?.uid===session?.user?.id)version=v.version;}catch{}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cloudSummary(){return cloudAvailable&&session?.user?'● 云端已连接 · 手动同步':'';}
export function cloudMarkup(){
  if(!cloudAvailable)return '<div class="storage-section"><div class="sync-badge">● 此设备存档 · 云端尚未启用</div><h3>电脑和手机，都可以接着冒险</h3><p>这个网址支持手机和电脑。当前数据分别保存在各自浏览器，还不能自动同步。云端服务接入后，可使用同一账号同步；现在可以通过导出、导入存档换设备。</p></div>';
  if(session?.user)return `<div class="storage-section"><div class="sync-badge">● 已连接云端 · 点击按钮同步</div><h3>${esc(session.user.email)}</h3><p>上传会保存这台设备的存档；读取会用云端存档替换此设备的数据。两台设备先后修改时会检查版本，避免无提示覆盖。${lastSynced?'最近同步：'+esc(lastSynced):''}</p><div class="button-row"><button class="button primary" id="cloud-push">↑ 保存到云端</button><button class="button" id="cloud-pull">↓ 读取云端</button><button class="text-button" id="cloud-logout">退出账号</button></div></div>`;
  return '<div class="storage-section"><div class="sync-badge">● 登录后可使用私人云端存档</div><h3>继续同一场冒险</h3><form id="cloud-auth"><label>邮箱<input type="email" id="cloud-email" required autocomplete="email" maxlength="254"></label><label>密码<input type="password" id="cloud-password" required minlength="8" autocomplete="current-password" maxlength="128"></label><div class="button-row"><button class="button primary" type="submit">登录</button><button class="button" type="button" id="cloud-signup">注册</button></div></form></div>';
}
async function call(path,{method='GET',body,auth=true}={}){
  if(!cloudAvailable)throw new Error('云端服务尚未启用。');
  if(auth&&session?.expires_at&&session.expires_at*1000<Date.now()+60000){const r=await fetch(config.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(15000)});const data=await r.json();if(!r.ok)throw new Error('登录已过期，请退出后重新登录。');saveSession(data);}
  const response=await fetch(config.url+path,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(auth&&session?.access_token?{Authorization:'Bearer '+session.access_token}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok)throw new Error(data.msg||data.message||data.error_description||'云端操作失败，请重试。');return data;
}
function saveSession(data){session=data;localStorage.setItem(AUTH,JSON.stringify(data));}
function saveVersion(n){version=n;localStorage.setItem(VERSION,JSON.stringify({uid:session.user.id,version:n}));}
export function bindCloud(hooks){
  if(!cloudAvailable)return;
  const byId=s=>document.getElementById(s);
  const run=async fn=>{if(busy)return;busy=true;document.querySelectorAll('#cloud-panel button').forEach(b=>b.disabled=true);try{await fn();}catch(e){hooks.toast(e.name==='TimeoutError'?'网络超时，当前设备存档仍然保留。':e.message);}finally{busy=false;hooks.refresh();}};
  if(!session?.user){
    const auth=signup=>run(async()=>{const email=byId('cloud-email').value,password=byId('cloud-password').value;if(!byId('cloud-auth').reportValidity())return;const data=await call(signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});if(data.access_token){saveSession(data);version=null;hooks.toast('已登录。请先读取云端存档，或保存此设备的存档。');}else hooks.toast('注册成功，请前往邮箱确认后再登录。');});
    byId('cloud-auth').onsubmit=e=>{e.preventDefault();auth(false);};byId('cloud-signup').onclick=()=>auth(true);return;
  }
  byId('cloud-logout').onclick=()=>run(async()=>{try{await call('/auth/v1/logout',{method:'POST'});}finally{session=null;version=null;lastSynced='';localStorage.removeItem(AUTH);localStorage.removeItem(VERSION);}hooks.toast('已退出账号，此设备存档保留。');});
  byId('cloud-pull').onclick=()=>run(async()=>{const rows=await call('/rest/v1/questlog_saves?select=version,payload');if(!rows.length){saveVersion(0);hooks.toast('云端还没有存档，可以先上传这台设备的进度。');return;}const snapshot=validateSave(rows[0].payload);if(!await hooks.confirm('读取云端存档？',`云端包含 ${snapshot.tasks.length} 个任务，将替换此设备存档。建议先导出备份。`,'读取并替换'))return;if(hooks.replace(snapshot)){saveVersion(rows[0].version);lastSynced=new Date().toLocaleString('zh-CN');hooks.toast('已读取云端存档。');}});
  byId('cloud-push').onclick=()=>run(async()=>{const snapshot=hooks.getSave();if(snapshot.demo){hooks.toast('请先建立自己的存档，再上传到云端。');return;}const captured=snapshot.revision;if(version===null){const rows=await call('/rest/v1/questlog_saves?select=version');if(rows.length){hooks.toast('云端已有存档，请先读取后再继续编辑；上传未执行。');return;}saveVersion(0);}const result=await call('/rest/v1/rpc/questlog_write',{method:'POST',body:{p_expected:version,p_snapshot:snapshot}});if(result.conflict){hooks.toast('另一设备已更新云端，请先导出当前存档，再读取云端最新版本。');return;}saveVersion(result.version);lastSynced=new Date().toLocaleString('zh-CN');hooks.toast(hooks.getSave().revision===captured?'私人存档已保存到云端。':'此前版本已上传，你刚刚的修改还需要再次保存到云端。');});
}
