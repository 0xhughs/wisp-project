import {readFileSync,writeFileSync,mkdirSync,lstatSync,realpathSync,renameSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
export const productFiles=['product-sdk.ts','approval-policy.ts','permission-fixtures.ts','local-permission-plugin.ts','compatible-plugin.ts','compatible-verification.ts','child-verification.ts','queue-verification.ts','safe-actions.mjs','safe-action-tools.ts','ax-actions.mjs','ax-action-tools.ts','visual-actions.mjs','visual-action-tools.ts','connection-config.mjs','connection-secrets.mjs','mcp-wrap.mjs','mcp-demo-fixture.mjs','mcp-connection.ts','mcp-verification.ts','plugin-config.mjs','plugin-overlay.mjs','product.patch.yml','skill-config.mjs','skill-wrap.mjs','skill-register.ts','skills/wisp-local-time-briefing/SKILL.md'];
const pin='d347e703908d0406b7a7ef80e3a0e594d86b2215';
export function prepareProduct(runtime,source=dirname(fileURLToPath(import.meta.url))) {
 const root=realpathSync(runtime),meta=JSON.parse(readFileSync(join(root,'.wisp-spike.json'))),up=join(root,'upstream');
 const git=args=>{const r=spawnSync('/usr/bin/git',['-C',up,...args],{encoding:'utf8'});if(r.status!==0)throw Error('PRODUCT_PIN');return r.stdout.trim();};
 if(meta.root!==root||meta.pin!==pin||git(['rev-parse','HEAD'])!==pin||git(['diff','--name-only','HEAD']))throw Error('PRODUCT_PIN');
 function directory(path){try{mkdirSync(path,{recursive:true,mode:0o700})}catch(e){if(e.code!=='EEXIST')throw e}const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==process.getuid())throw Error('PRODUCT_DIRECTORY');}
 const base=join(up,'wisp-product');directory(base);const destination=join(base,'engine');directory(destination);
 for(const name of productFiles) {
  const bytes=readFileSync(join(source,name)),target=join(destination,name);
  directory(dirname(target));
  try {const s=lstatSync(target);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.uid!==process.getuid())throw Error('PRODUCT_FILE');if(readFileSync(target).equals(bytes))continue;}catch(e){if(e.code!=='ENOENT')throw e;}
  const temp=join(dirname(target),'.'+randomUUID());writeFileSync(temp,bytes,{mode:0o600,flag:'wx'});renameSync(temp,target);
 }
 return {pin,files:productFiles.length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length!==3)throw Error('Usage: prepare-product.mjs /prepared/runtime');
 console.log(JSON.stringify(prepareProduct(process.argv[2])));
}
