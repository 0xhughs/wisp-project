import {openSync,closeSync,fstatSync,writeSync,constants} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const labelRe=/^[A-Za-z0-9_-]{1,40}$/;
function parseArgs(argv){
 const options={};
 for(let i=0;i<argv.length;i+=1){
  if(argv[i]==='--ledger'){if(!argv[i+1]||options.ledger)throw Error('WISP_MCP_FIXTURE');options.ledger=argv[++i];continue;}
  if(argv[i]==='--extra-tool'){options.extra=true;continue;}
  if(argv[i]==='--emit-change'){options.emitChange=true;continue;}
  throw Error('WISP_MCP_FIXTURE');
 }
 const ledger=options.ledger||process.env.WISP_MCP_LEDGER;
 if(typeof ledger!=='string'||!ledger)throw Error('WISP_LEDGER_REQUIRED');
 return {ledger,extra:!!options.extra||process.env.WISP_MCP_EXTRA_TOOL==='1',emitChange:!!options.emitChange||process.env.WISP_MCP_EMIT_CHANGE==='1'};
}
function send(message){
 process.stdout.write(JSON.stringify(message)+'\n');
}
function tools(){
 const record={
  name:'record',
  description:'Append one harmless Wisp verification record after Wisp asks. Call exactly once when explicitly requested. Never retry after denial or cancellation.',
  inputSchema:{type:'object',properties:{label:{type:'string',pattern:'^[A-Za-z0-9_-]{1,40}$'}},required:['label'],additionalProperties:false},
 };
 return extra? [record,{name:'extra',description:'Unadmitted hostile MCP tool',inputSchema:{type:'object',properties:{}}}] : [record];
}
let extra=false,calls=0,fd,original,rpcPath,changeEmitted=false;
function writeCalls(){
 const text=JSON.stringify({toolsCall:calls})+'\n';
 const rpc=openSync(rpcPath,constants.O_WRONLY|constants.O_CREAT|constants.O_TRUNC|constants.O_NOFOLLOW,0o600);
 try{writeSync(rpc,text);}finally{closeSync(rpc);}
}
function handle(message){
 if(!message||typeof message!=='object'||message.jsonrpc!=='2.0')return;
 if(message.method==='notifications/initialized'||message.method==='notifications/cancelled')return;
 if(typeof message.id==='undefined')return;
 const reply=result=>{send({jsonrpc:'2.0',id:message.id,result});};
 const fail=(code,err)=>{send({jsonrpc:'2.0',id:message.id,error:{code,message:err}});};
 if(message.method==='initialize'){
  const version=message.params&&typeof message.params.protocolVersion==='string'?message.params.protocolVersion:'2025-03-26';
  return reply({protocolVersion:version,capabilities:{tools:{listChanged:true}},serverInfo:{name:'wisp-demo-mcp',version:'1'}});
 }
 if(message.method==='ping')return reply({});
 if(message.method==='tools/list'){
  const listed=tools();
  if(changeEmitted===false&&emitChange){changeEmitted=true;setImmediate(()=>send({jsonrpc:'2.0',method:'notifications/tools/list_changed'}));}
  return reply({tools:listed});
 }
 if(message.method==='tools/call'){
  calls+=1;writeCalls();
  const params=message.params||{};
  if(params.name!=='record')return fail(-32602,'raw name record is required');
  const args=params.arguments;
  if(!args||typeof args!=='object'||Array.isArray(args)||Object.keys(args).sort().join()!=='label'||typeof args.label!=='string'||!labelRe.test(args.label)){
   return reply({content:[{type:'text',text:'invalid arguments'}],isError:true});
  }
  const stat=fstatSync(fd);
  if(stat.nlink!==1||stat.ino!==original.ino||stat.dev!==original.dev)throw Error('WISP_LEDGER_CHANGED');
  writeSync(fd,JSON.stringify({label:args.label,source:'wisp-mcp',tool:'record'})+'\n');
  return reply({content:[{type:'text',text:'One verification record appended.'}]});
 }
 return fail(-32601,'Method not found');
}
let emitChange=false;
export function startFixture(argv=process.argv.slice(2)){
 const options=parseArgs(argv);
 extra=options.extra;emitChange=options.emitChange;
 fd=openSync(options.ledger,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
 original=fstatSync(fd);
 if(!original.isFile()||original.nlink!==1||original.uid!==process.getuid?.()){closeSync(fd);throw Error('WISP_LEDGER_OWNERSHIP');}
 rpcPath=options.ledger+'.rpc';
 writeCalls();
 let buffer='';
 process.stdin.setEncoding('utf8');
 process.stdin.on('data',chunk=>{
  buffer+=chunk;
  if(Buffer.byteLength(buffer)>1_000_000)throw Error('WISP_MCP_FRAME');
  const parts=buffer.split('\n');buffer=parts.pop();
  for(const line of parts){if(!line)continue;handle(JSON.parse(line));}
 });
 process.stdin.on('end',()=>{try{closeSync(fd);}catch{/* already closed */}process.exit(0);});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))startFixture();
