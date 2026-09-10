import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
export function parseFrame(line) {
  const f=JSON.parse(line);
  if(f?.jsonrpc!=='2.0'||!(typeof f.method==='string'||(('id' in f)&&(('result' in f)||('error' in f)))))throw new Error('WISP_PROTOCOL');
  return f;
}
export function completedTurn(frames,sessionId,messageId,expected='completed') {
  const events=frames.filter(f=>f.method==='session.event'&&f.params.sessionId===sessionId).map(f=>f.params.event);
  for(let i=1;i<events.length;i++)if(events[i].seq!==events[i-1].seq+1)throw new Error('WISP_EVENT_GAP');
  const ui=events.findIndex(e=>e.type==='user/message'&&e.data.id===messageId);
  if(ui<0)return null;
  const start=events.slice(0,ui).findLast(e=>e.type==='turn/start');
  if(!start)throw new Error('WISP_MISSING_TURN');
  const end=events.slice(ui).find(e=>e.type==='turn/end'&&e.data.turn===start.data.turn);
  if(!end)return null;
  if(end.data.reason.kind!==expected)throw new Error('WISP_TURN_'+end.data.reason.kind);
  if(events.filter(e=>e.type==='user/message').length!==1||events.filter(e=>e.type==='turn/start').length!==1)throw new Error('WISP_UNSOLICITED_TURN');
  const endIndex=frames.findIndex(f=>f.method==='session.event'&&f.params.sessionId===sessionId&&f.params.event===end);
  const lastStatus=frames.slice(endIndex+1).findLast(f=>f.method==='session.status'&&f.params.sessionId===sessionId);
  if(lastStatus?.params.status!=='idle')return null;
  const text=events.filter(e=>e.type==='assistant/message'&&e.data.turn===start.data.turn&&!e.data.interrupted).flatMap(e=>e.data.message.content.filter(c=>c.type==='text').map(c=>c.text)).join('\n').trim();
  if(expected==='completed'&&!text)throw new Error('WISP_NO_FINAL_TEXT');
  return {turn:start.data.turn,reason:end.data.reason.kind,text,eventCount:events.length};
}
export class Client {
  frames=[];pending=new Map();seq=0;failure=null;stderr='';
  constructor(node,argv,{cwd,env}) {
    this.child=spawn(node,argv,{cwd,env,stdio:['pipe','pipe','pipe'],detached:true});
    this.pid=this.child.pid;
    this.exit=new Promise(resolve=>this.child.on('exit',(code,signal)=>{this.exited={code,signal};for(const p of this.pending.values())p.reject(new Error('WISP_EOF'));this.pending.clear();resolve(this.exited);}));
    this.child.on('error',e=>{this.failure=e;});
    this.child.stderr.on('data',b=>{this.stderr+=b.toString();});
    this.lines=createInterface({input:this.child.stdout});
    this.lines.on('line',line=>{
      if(!line.trim())return;
      try {const f=parseFrame(line);this.frames.push(f);if('id'in f){const p=this.pending.get(f.id);if(!p)throw new Error('WISP_UNKNOWN_REPLY');this.pending.delete(f.id);f.error?p.reject(new Error(f.error.message)):p.resolve(f.result);}}
      catch(e){this.failure=e;}
    });
  }
  async request(method,params={},deadline=30000) {
    if(this.failure)throw this.failure;
    if(this.exited)throw new Error('WISP_EOF');
    const id=++this.seq;
    const p=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
    this.child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
    let timer;
    try {return await Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('WISP_RPC_TIMEOUT')),deadline);})]);}
    finally {clearTimeout(timer);}
  }
  async wait(fn,deadline=120000) {
    const until=Date.now()+deadline;
    do {if(this.failure)throw this.failure;const result=fn(this.frames);if(result)return result;if(this.exited)throw new Error('WISP_EOF');await delay(10);}while(Date.now()<until);
    throw new Error('WISP_TURN_TIMEOUT');
  }
  observe() {
    const ps=spawnSync('/bin/ps',['-axo','pid=,ppid=,pgid=,comm='],{encoding:'utf8'}).stdout;
    const owned=ps.split('\n').filter(l=>Number(l.trim().split(/\s+/)[2])===this.pid);
    const sockets=spawnSync('/usr/sbin/lsof',['-nP','-a','-g',String(this.pid),'-iTCP','-sTCP:LISTEN'],{encoding:'utf8'});
    if(sockets.status===0&&sockets.stdout.trim())throw new Error('WISP_LISTENER');
    if(owned.some(l=>/chrome|safari|firefox|webkit/i.test(l)))throw new Error('WISP_BROWSER');
    return {ownedProcesses:owned.length,tcpListeners:0,browserProcesses:0};
  }
  noOrphan() {
    let alive=false;try{process.kill(this.pid,0);alive=true;}catch(e){if(e.code!=='ESRCH')throw e;}
    const ps=spawnSync('/bin/ps',['-axo','pid=,pgid='],{encoding:'utf8'}).stdout;
    if(alive||ps.split('\n').some(l=>Number(l.trim().split(/\s+/)[1])===this.pid))throw new Error('WISP_ORPHAN');
  }
  async join(deadline=10000) {let timer;try{const r=await Promise.race([this.exit,new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('WISP_EXIT_TIMEOUT')),deadline))]);this.noOrphan();return r;}finally{clearTimeout(timer);}}
  async shutdown() {await this.request('shutdown',{},10000);const r=await this.join();if(r.code!==0)throw new Error('WISP_SHUTDOWN_FAILED');return {exitCode:r.code,noOrphan:true,shutdownResponse:true};}
  async force() {if(!this.exited){try{process.kill(-this.pid,'SIGTERM');}catch{}try{await this.join(5000);}catch{try{process.kill(-this.pid,'SIGKILL');}catch{}await this.join(5000);}}this.noOrphan();}
}

// Read only the pinned backend's project/session layout; never traverse profile dependencies.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zstdDecompressSync } from 'node:zlib';
export function readDurableSession(home, sessionId) {
  const files=[];
  const directories=p=>readdirSync(p,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>join(p,e.name));
  for(const project of directories(join(home,'sessions')))for(const session of directories(project)) {
    for(const file of readdirSync(session,{withFileTypes:true}))if(file.isFile()&&/^session\.v2\.jsonl(?:\.zstd)?$/.test(file.name))files.push(join(session,file.name));
  }
  const logs=files.map(file=>{
    let bytes=readFileSync(file),text='';
    if(file.endsWith('.zstd'))while(bytes.length) {
      const result=zstdDecompressSync(bytes,{info:true,maxOutputLength:16*1024*1024});
      if(!result.engine.bytesWritten)throw new Error('WISP_AUDIT_FRAME');
      text+=result.buffer.toString('utf8');bytes=bytes.subarray(result.engine.bytesWritten);
    }else text=bytes.toString('utf8');
    return {file,records:text.split('\n').filter(Boolean).map(line=>JSON.parse(line))};
  }).filter(log=>log.records[0]?.type==='session'&&log.records[0]?.id===sessionId);
  if(logs.length!==1)throw new Error('WISP_AUDIT_SESSION');
  return logs[0];
}
