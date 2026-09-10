import {openSync,readFileSync,fstatSync,closeSync,constants} from 'node:fs';
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function keys(value,names) { return value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).sort().join()===names.sort().join(); }
export function validateSnapshot(value) {
  if (!keys(value,['version','companionId','revision','memory']) || value.version!==1 || typeof value.companionId!=='string' || !uuid.test(value.companionId) || !/^[a-f0-9]{64}$/.test(value.revision)) throw Error('WISP_MEMORY_INVALID');
  const m=value.memory;
  if (!keys(m,['version','entries']) || m.version!==1 || !Array.isArray(m.entries) || m.entries.length>64 || Buffer.byteLength(JSON.stringify(m))>32768) throw Error('WISP_MEMORY_INVALID');
  const ids=new Set();
  for (const e of m.entries) {
    if (!keys(e,['id','category','text']) || typeof e.id!=='string' || !uuid.test(e.id) || ids.has(e.id.toLowerCase()) || !['preference','project','instruction','fact'].includes(e.category) || typeof e.text!=='string' || !e.text.trim() || [...e.text].length>2000 || e.text.includes('\0')) throw Error('WISP_MEMORY_INVALID');
    ids.add(e.id.toLowerCase());
  }
  return structuredClone(value);
}
export function readSnapshot(path) {
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try {
    const st=fstatSync(fd); if(!st.isFile() || st.uid!==process.getuid() || st.nlink!==1 || (st.mode&0o077) || st.size>65536)throw Error('WISP_MEMORY_UNSAFE');
    const bytes=readFileSync(fd); if(bytes.length>65536)throw Error('WISP_MEMORY_INVALID');
    return validateSnapshot(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
  } finally {closeSync(fd);}
}
