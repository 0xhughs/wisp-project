import {spawn} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';

/** Minimal NDJSON MCP client for Linux-supplemental stdio proof. Not the pin client. */
export class McpStdioClient {
 constructor(command,args,options={}){
  this.child=spawn(command,args,{stdio:['pipe','pipe','pipe'],cwd:options.cwd,env:options.env||process.env});
  this.buffer='';this.pending=new Map();this.nextId=1;this.notifications=[];this.closed=false;
  this.child.stderr.resume();
  this.child.stdout.setEncoding('utf8');
  this.child.stdout.on('data',chunk=>{
   this.buffer+=chunk;
   const parts=this.buffer.split('\n');this.buffer=parts.pop();
   for(const line of parts){
    if(!line)continue;
    const message=JSON.parse(line);
    if(message.method&&typeof message.id==='undefined'){this.notifications.push(message);continue;}
    const waiter=this.pending.get(message.id);
    if(!waiter)continue;
    this.pending.delete(message.id);
    if(message.error)waiter.reject(Error(message.error.message||'MCP_ERROR'));
    else waiter.resolve(message.result);
   }
  });
  this.child.on('exit',()=>{this.closed=true;for(const waiter of this.pending.values())waiter.reject(Error('MCP_CLOSED'));this.pending.clear();});
 }
 request(method,params){
  const id=this.nextId++;
  const message={jsonrpc:'2.0',id,method,...(params===undefined?{}:{params})};
  const task=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
  this.child.stdin.write(JSON.stringify(message)+'\n');
  return task;
 }
 notify(method,params){
  this.child.stdin.write(JSON.stringify({jsonrpc:'2.0',method,...(params===undefined?{}:{params})})+'\n');
 }
 async initialize(){
  const result=await this.request('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'wisp-linux-mcp',version:'1'}});
  this.notify('notifications/initialized');
  return result;
 }
 listTools(){return this.request('tools/list',{});}
 callTool(name,args){return this.request('tools/call',{name,arguments:args});}
 async close(){
  try{this.child.stdin.end();}catch{/* already closed */}
  await new Promise(resolve=>{if(this.closed)return resolve();this.child.once('exit',resolve);setTimeout(()=>{this.child.kill('SIGKILL');resolve();},2000);});
 }
}

export function rpcCount(ledger){
 const path=ledger+'.rpc';
 if(!existsSync(path))return 0;
 const raw=JSON.parse(readFileSync(path,'utf8'));
 return Number(raw.toolsCall)||0;
}
export function ledgerLines(ledger){
 if(!existsSync(ledger))return [];
 return readFileSync(ledger,'utf8').trim().split('\n').filter(Boolean);
}
