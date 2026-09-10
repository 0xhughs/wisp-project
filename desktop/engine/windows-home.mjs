// Linux-supplemental Windows home/pointer validators. No getuid, no Node spawn, no Win32.

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MARKER_KEYS=Object.freeze(['companionId','version']);
export const POINTER_KEYS=Object.freeze(['companionId','path','version']);
export const HOME_README='Wisp home format 1\nEdit memory.json: version 1, entries with UUID id, category preference/project/instruction/fact, and plain text. Maximum 64 entries, 2000 Unicode scalars per text, 32 KiB document. Keep file mode 600. Never place credentials in memory. Save and reload in Wisp; edits apply on next app launch. Files in files/ are yours and are not scanned. Do not edit wisp-home.json. Internal sessions are separate.\n';
export const POINTER_LEAF='home.json';
export const MARKER_LEAF='wisp-home.json';
export const LOCK_LEAF='.wisp-lock';
export const OWNED_MARK='.wisp-owned';
export const DEFAULT_POINTER_DIR='%LOCALAPPDATA%\\Wisp';

function exactKeys(value,names){
 return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join()===names.slice().sort().join();
}

function asObject(value,error){
 if(typeof value==='string'){
  try{value=JSON.parse(value);}catch{throw Error(error);}
 }
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(error);
 return value;
}

export function companionUuid(value){
 if(typeof value!=='string'||!UUID.test(value))throw Error('WISP_HOME_INVALID');
 return value.toLowerCase();
}

export function parseMarker(value){
 const object=asObject(value,'WISP_HOME_INVALID');
 if(Object.prototype.hasOwnProperty.call(object,'bookmark'))throw Error('WISP_HOME_INVALID');
 if(!exactKeys(object,MARKER_KEYS))throw Error('WISP_HOME_INVALID');
 if(!Number.isInteger(object.version)||object.version!==1)throw Error('WISP_HOME_INVALID');
 return {version:1,companionId:companionUuid(object.companionId)};
}

function rejectAdsAndDots(path){
 if(path.includes('..')||path.includes('\0')||path.includes('/'))throw Error('WISP_POINTER_INVALID');
 const parts=path.split('\\');
 for(const part of parts){
  if(part==='.'||part==='..')throw Error('WISP_POINTER_INVALID');
 }
}

export function validateWindowsPath(path){
 if(typeof path!=='string'||path.length<4||path.length>32767)throw Error('WISP_POINTER_INVALID');
 rejectAdsAndDots(path);
 if(path.startsWith('\\\\')){
  if(path.startsWith('\\\\?\\')||path.startsWith('\\\\.\\'))throw Error('WISP_POINTER_INVALID');
  if(path.includes(':'))throw Error('WISP_POINTER_INVALID');
  if(!/^\\\\[^\\]+\\[^\\]+(?:\\[^\\]+)*$/.test(path))throw Error('WISP_POINTER_INVALID');
  return path;
 }
 if(!/^[A-Za-z]:\\[^\\]/.test(path))throw Error('WISP_POINTER_INVALID');
 if(path.slice(2).includes(':'))throw Error('WISP_POINTER_INVALID');
 if(path.endsWith('\\'))throw Error('WISP_POINTER_INVALID');
 const parts=path.split('\\');
 if(parts[0].length!==2||parts.length<2||parts.slice(1).some(part=>part.length===0))throw Error('WISP_POINTER_INVALID');
 return path;
}

export function winPathPrefix(path){
 return validateWindowsPath(path).replace(/\\+$/,'').toLowerCase()+'\\';
}

export function pathsOverlap(a,b){
 const A=winPathPrefix(a),B=winPathPrefix(b);
 return A.startsWith(B)||B.startsWith(A);
}

export function isDirectChild(parent,child){
 const p=validateWindowsPath(parent).replace(/\\+$/,'');
 const c=validateWindowsPath(child).replace(/\\+$/,'');
 const prefix=p.toLowerCase()+'\\';
 if(!c.toLowerCase().startsWith(prefix))return false;
 const rest=c.slice(p.length+1);
 return rest.length>0&&!rest.includes('\\');
}

export function parsePointer(value){
 const object=asObject(value,'WISP_POINTER_INVALID');
 if(Object.prototype.hasOwnProperty.call(object,'bookmark'))throw Error('WISP_POINTER_INVALID');
 if(!exactKeys(object,POINTER_KEYS))throw Error('WISP_POINTER_INVALID');
 if(!Number.isInteger(object.version)||object.version!==1)throw Error('WISP_POINTER_INVALID');
 const companionId=companionUuid(object.companionId);
 const path=validateWindowsPath(object.path);
 return {version:1,companionId,path};
}

export function encodeMarker(companionId){
 return {version:1,companionId:companionUuid(companionId)};
}

export function encodePointer(companionId,path){
 return {version:1,companionId:companionUuid(companionId),path:validateWindowsPath(path)};
}

export function assertPointerSeparation(homePath,supportPath,scratchPath){
 const home=validateWindowsPath(homePath);
 const support=validateWindowsPath(supportPath);
 if(pathsOverlap(home,support))throw Error('WISP_HOME_UNSAFE');
 if(scratchPath){
  const scratch=validateWindowsPath(scratchPath);
  if(pathsOverlap(home,scratch))throw Error('WISP_HOME_UNSAFE');
 }
 return true;
}

export function validateTestSupport({scratch,testSupport,listing}={}){
 if(!scratch||!testSupport)throw Error('WISP_HOME_UNSAFE');
 if(!isDirectChild(scratch,testSupport))throw Error('WISP_HOME_UNSAFE');
 if(listing!==undefined&&!(Array.isArray(listing)&&listing.includes(OWNED_MARK)))throw Error('WISP_HOME_UNSAFE');
 return {scratch:validateWindowsPath(scratch),testSupport:validateWindowsPath(testSupport)};
}

export function reuseOrMintCompanionId({marker,injectedId}={}){
 if(marker!=null&&marker!==''){
  return parseMarker(typeof marker==='string'?JSON.parse(marker):marker).companionId;
 }
 if(typeof injectedId!=='string'||!UUID.test(injectedId))throw Error('WISP_HOME_MINT');
 return injectedId.toLowerCase();
}

export function mintHomeFiles(injectedId){
 const companionId=companionUuid(injectedId);
 return {
  [MARKER_LEAF]:encodeMarker(companionId),
  'memory.json':{version:1,entries:[]},
  'README.txt':HOME_README,
  files:true,
  [LOCK_LEAF]:true,
 };
}

export function planFolderChoice({cancelled=false,existingMarker,injectedId,selectedPath,supportPath,scratchPath}={}){
 if(cancelled)return {action:'noop'};
 if(typeof selectedPath!=='string')throw Error('WISP_HOME_INVALID');
 validateWindowsPath(selectedPath);
 assertPointerSeparation(selectedPath,supportPath,scratchPath);
 if(existingMarker!=null&&existingMarker!==''){
  const companionId=parseMarker(typeof existingMarker==='string'?JSON.parse(existingMarker):existingMarker).companionId;
  return {
   action:'reuse',
   companionId,
   writeMarker:false,
   pointer:encodePointer(companionId,selectedPath),
  };
 }
 const companionId=reuseOrMintCompanionId({marker:null,injectedId});
 return {
  action:'mint',
  companionId,
  writeMarker:true,
  pointer:encodePointer(companionId,selectedPath),
  files:mintHomeFiles(companionId),
 };
}

export function bindPointerToMarker(pointer,marker){
 const p=parsePointer(pointer);
 const m=parseMarker(marker);
 if(p.companionId!==m.companionId)throw Error('WISP_HOME_INVALID');
 return {companionId:p.companionId,path:p.path};
}
