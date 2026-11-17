// Every remote write checks the expected version atomically in Postgres.
export const signature = save => JSON.stringify({schema:save.schema,demo:save.demo,tasks:save.tasks});
export function createSyncEngine(h) {
  let active=true, running=null, again=false;
  const status=(state,message)=>{if(active)h.status(state,message);};
  const ack=(version,sig)=>h.setMeta({uid:h.uid,version,ackSig:sig});
  async function cycle(mode='auto') {
    if(h.canWrite&&!h.canWrite()){status('pending','另一窗口已更新，请先刷新此页面');return;}
    const captured=structuredClone(h.getSave()), sig=signature(captured);
    status('syncing','正在同步…');
    const remote=await h.readRemote();
    if(!active)return;
    if(h.canWrite&&!h.canWrite()){status('pending','另一窗口已更新，请先刷新此页面');return;}
    if(signature(h.getSave())!==sig){again=true;return;}
    const meta=h.getMeta(), own=meta?.uid===h.uid, dirty=!own||sig!==meta.ackSig;
    const foreign=meta?.uid&&meta.uid!==h.uid;
    if(remote&&signature(remote.payload)===sig){ack(remote.version,sig);status('synced','已与云端同步');return;}
    if(mode==='pull') {
      if(!remote){status('empty','云端还没有存档');return;}
      if(!h.canApply()||!h.replace(remote.payload)){status('pending','请先结束编辑，再读取云端');return;}
      ack(remote.version,signature(h.getSave()));status('synced','已读取云端存档');return;
    }
    if(mode!=='push'&&foreign){status('conflict','此设备存档属于另一个账号，请选择读取或上传');return;}
    if(mode!=='push'&&remote) {
      if(!dirty||captured.demo||(!own&&!captured.tasks.length)) {
        if(!h.canApply()||!h.replace(remote.payload)){status('pending','云端有更新，将在结束编辑后读取');return;}
        ack(remote.version,signature(h.getSave()));status('synced','已读取另一设备的进度');return;
      }
      if(!own||remote.version!==meta.version){status('conflict','两份存档存在不同修改，请打开存档与同步处理');return;}
    }
    if(captured.demo){status('demo','建立个人存档后开始同步');return;}
    if(h.canWrite&&!h.canWrite()){status('pending','另一窗口已更新，请先刷新此页面');return;}
    const result=await h.writeRemote(remote?.version??0,captured);
    if(!active)return;
    if(result.conflict){status('conflict','另一设备刚更新了云端，请重新同步');return;}
    ack(result.version,sig);
    if(signature(h.getSave())!==sig){again=true;status('pending','新修改等待同步');}
    else status('synced','已与云端同步');
  }
  return {
    async sync(mode='auto') {
      if(!active)return;
      if(running){if(mode!=='auto')return false;again=true;return running;}
      running=(async()=>{try{await cycle(mode);}catch(e){status('error',e.message||'暂时无法联网，修改已保存在此设备');}finally{running=null;}})();
      await running;
      if(active&&again){again=false;return this.sync();}
      return true;
    },
    stop(){active=false;again=false;},
    get busy(){return Boolean(running);}
  };
}
