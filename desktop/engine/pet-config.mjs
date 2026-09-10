import {mkdirSync,openSync,readFileSync,writeFileSync,fstatSync,closeSync,constants} from 'node:fs';
import {join} from 'node:path';
import {keys} from './plugin-config.mjs';

export const SELECTABLE_IDS=Object.freeze(['wisp-orb','wisp-fox','wisp-robot','wisp-bird','wisp-cat','wisp-owl','wisp-sprout','wisp-capsule']);
export const DEFAULT_CATALOG_ID='wisp-orb';
export const UNSUPPORTED_SKINS_ID='official-skins';
export const PET_MAX_BYTES=4096;

export const RASTER_SAMPLES=Object.freeze({
 'wisp-orb':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,98]),uniqueOpaque:Object.freeze([40,80])}),
 'wisp-fox':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,78]),uniqueOpaque:Object.freeze([52,20])}),
 'wisp-robot':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,34]),uniqueOpaque:Object.freeze([80,8])}),
 'wisp-bird':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([92,64]),uniqueOpaque:Object.freeze([138,76])}),
 'wisp-cat':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,101]),uniqueOpaque:Object.freeze([50,24])}),
 'wisp-owl':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,67]),uniqueOpaque:Object.freeze([56,16])}),
 'wisp-sprout':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,53]),uniqueOpaque:Object.freeze([32,40])}),
 'wisp-capsule':Object.freeze({corner:Object.freeze([0,0]),gap:Object.freeze([80,60]),uniqueOpaque:Object.freeze([80,24])}),
});

export function defaultPetConfiguration(){return {version:1,catalogId:DEFAULT_CATALOG_ID};}

export function validatePetConfiguration(value){
 if(value==null||typeof value!=='object'||Array.isArray(value))throw Error('PET_INVALID');
 if(JSON.stringify(value).length>PET_MAX_BYTES)throw Error('PET_INVALID');
 if(!keys(value,['version','catalogId'])||value.version!==1||typeof value.catalogId!=='string'||!SELECTABLE_IDS.includes(value.catalogId))throw Error('PET_INVALID');
 return {version:1,catalogId:value.catalogId};
}

export function rasterSamples(catalogId){
 if(!SELECTABLE_IDS.includes(catalogId))throw Error('PET_INVALID');
 const sample=RASTER_SAMPLES[catalogId];
 return {corner:[...sample.corner],gap:[...sample.gap],uniqueOpaque:[...sample.uniqueOpaque]};
}

export function bodyStatus({id,savedId=DEFAULT_CATALOG_ID,currentId=DEFAULT_CATALOG_ID,applying=false,applyingId}={}){
 if(id===UNSUPPORTED_SKINS_ID)return 'unavailable';
 if(applying&&applyingId===id)return 'applying';
 if(id===currentId&&SELECTABLE_IDS.includes(id))return 'current';
 if(id===savedId&&SELECTABLE_IDS.includes(id))return 'saved';
 if(SELECTABLE_IDS.includes(id))return 'available';
 return 'unavailable';
}

const BODY_ROWS=[
 {id:'wisp-orb',kind:'body',title:'Wisp orb',detail:'Default even-odd oval with an interior gap. Teal idle, amber listening, cyan speaking. Original Wisp-authored programmatic artwork.'},
 {id:'wisp-fox',kind:'body',title:'Fox',detail:'Original in-repo fox silhouette with an interior gap. Same Wisp; listening and speaking reactions are fox-specific.'},
 {id:'wisp-robot',kind:'body',title:'Robot',detail:'Original in-repo robot silhouette with an interior gap. Same Wisp; listening and speaking reactions are robot-specific.'},
 {id:'wisp-bird',kind:'body',title:'Bird',detail:'Original in-repo bird silhouette with a pointed beak and tail and an even-odd eye gap. Same Wisp; listening and speaking reactions are bird-specific.'},
 {id:'wisp-cat',kind:'body',title:'Cat',detail:'Original in-repo sitting-cat silhouette with two pointed ears and an even-odd belly gap. Same Wisp; listening and speaking reactions are cat-specific.'},
 {id:'wisp-owl',kind:'body',title:'Owl',detail:'Original in-repo round owl with ear tufts and an even-odd eye-ring gap. Same Wisp; listening and speaking reactions are owl-specific.'},
 {id:'wisp-sprout',kind:'body',title:'Sprout',detail:'Original in-repo two-leaf plant companion with an even-odd between-leaf gap. Same Wisp; listening and speaking reactions are sprout-specific.'},
 {id:'wisp-capsule',kind:'body',title:'Capsule',detail:'Original in-repo vertical rounded capsule with an even-odd porthole gap. Same Wisp; listening and speaking reactions are capsule-specific.'},
];
const SKINS_ROW={id:UNSUPPORTED_SKINS_ID,kind:'unsupported',title:'Additional official skins',detail:'Further official skins toward the eventual collection remain later. No marketplace, third-party pack, or extra skins were queried.'};

export function catalogRows(state={}){
 const savedId=state.savedId||DEFAULT_CATALOG_ID;
 const currentId=state.currentId||savedId;
 const applying=!!state.applying;
 const applyingId=state.applyingId;
 return [
  ...BODY_ROWS.map(row=>{
   const status=bodyStatus({id:row.id,savedId,currentId,applying,applyingId});
   return {...row,status,canManage:!applying};
  }),
  {...SKINS_ROW,status:'unavailable',canManage:false},
 ];
}

export function writePetSnapshot(supportDir,configuration){
 const value=validatePetConfiguration(configuration);
 const dir=join(supportDir,'pets');
 mkdirSync(dir,{recursive:true,mode:0o700});
 writeFileSync(join(dir,'config.json'),JSON.stringify(value),{mode:0o600});
 return value;
}

export function readPetSnapshot(path){
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);
 try{
  const st=fstatSync(fd);if(!st.isFile()||st.uid!==process.getuid()||st.nlink!==1||(st.mode&0o077)||st.size>PET_MAX_BYTES)throw Error('PET_UNSAFE');
  const bytes=readFileSync(fd);if(bytes.length>PET_MAX_BYTES)throw Error('PET_INVALID');
  return validatePetConfiguration(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
 }finally{closeSync(fd);}
}
