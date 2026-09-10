import {openSync,readFileSync,writeFileSync,fstatSync,closeSync,constants,renameSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {randomUUID} from 'node:crypto';

function openOwned(path,flags,mode){
 const fd=openSync(path,flags|constants.O_NOFOLLOW,mode);
 try{
  const st=fstatSync(fd);
  if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077))throw Error('CONNECTION_SECRET_UNSAFE');
  return fd;
 }catch(error){closeSync(fd);throw error;}
}
export function writeConnectionSecretStore(path,records){
 if(!path||typeof path!=='string'||!Array.isArray(records))throw Error('CONNECTION_SECRET_INVALID');
 for(const row of records){
  if(!row||typeof row!=='object'||typeof row.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(row.id)||typeof row.value!=='string'||!row.value||row.value.length>4096)throw Error('CONNECTION_SECRET_INVALID');
 }
 const dir=dirname(path);
 const temp=join(dir,'.'+randomUUID());
 writeFileSync(temp,JSON.stringify({version:1,records:records.map(r=>({id:r.id,value:r.value}))}),{mode:0o600,flag:'wx'});
 renameSync(temp,path);
}
export function readConnectionSecret(path,id){
 if(!id)return '';
 const fd=openOwned(path,constants.O_RDONLY,0o600);
 try{
  const bytes=readFileSync(fd);
  if(bytes.length>8192)throw Error('CONNECTION_SECRET_INVALID');
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(!data||data.version!==1||!Array.isArray(data.records))throw Error('CONNECTION_SECRET_INVALID');
  const row=data.records.find(r=>r&&r.id===id);
  return row&&typeof row.value==='string'?row.value:'';
 }finally{closeSync(fd);}
}
