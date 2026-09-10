import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, cpSync, realpathSync, symlinkSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { createRequire } from 'node:module';
export const PIN = 'd347e703908d0406b7a7ef80e3a0e594d86b2215';
export function loadAuthorizedRoute(path) {
 try {
  const bytes=readFileSync(path);
  if(createHash('sha256').update(bytes).digest('hex')!=='5afb9e4971433c059e1ec76ea772da8527981ad9ccdcccf951dc2543a1571f5d')throw new Error();
  return {bytes,route:JSON.parse(bytes)};
 } catch {throw new Error('LIVE_RESOURCE_UNAVAILABLE');}
}

export function args(argv = process.argv.slice(2)) { return Object.fromEntries(Array.from({length: argv.length / 2}, (_,i)=>[argv[i*2].replace(/^--/,''), argv[i*2+1]])); }
export function command(bin, argv, cwd, env) {
  console.error(JSON.stringify({command:bin, argv, cwd}));
  const r=spawnSync(bin,argv,{cwd,env,stdio:'inherit'});
  if(r.status!==0) throw new Error(`command failed: ${bin} (${r.status})`);
}
export function environment(root, pnpm, tempAlias=join(root,'tmp')) { return { PATH:`${resolve(dirname(pnpm), "../../.bin")}:${dirname(pnpm)}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`, TMPDIR:tempAlias, XDG_CACHE_HOME:join(root,'cache'), DSH_HOME:join(root,'dsh-home'), DSH_TELEMETRY_DISABLED:'1', CI:'1' }; }
if(process.argv[1]===new URL(import.meta.url).pathname) {
 const a=args(), source=realpathSync(resolve(a.source)), root=resolve(a.root);
 const allowed=resolve('../../work/wisp-01');
 if(!root.startsWith(allowed+'/') || existsSync(root)) throw new Error('fresh run root required under work/wisp-01');
 const node=realpathSync(process.execPath), pnpm=realpathSync(resolve('../../work/tooling/node_modules/.bin/pnpm'));
 const query=(b,v)=>spawnSync(b,v,{encoding:'utf8'}).stdout.trim();
 if(query('git',['-C',source,'rev-parse','HEAD'])!==PIN || query('git',['-C',source,'status','--porcelain','--untracked-files=all'])) throw new Error('source not pristine pin');
 const [major,minor]=process.versions.node.split('.').map(Number);
 if(!(major>=24 || major===22 && minor>=19)) throw new Error('unsupported node');
 if(query(pnpm,['--version'])!=='11.7.0') throw new Error('pnpm must be 11.7.0');
 for(const d of ['','tmp','cache','proof','workspace','dsh-home']) mkdirSync(join(root,d),{recursive:true,mode:0o700});
 const tempAlias='/tmp/wisp01-'+randomUUID();
 symlinkSync(join(root,'tmp'),tempAlias);
 if(realpathSync(tempAlias)!==realpathSync(join(root,'tmp'))) throw new Error('temp alias mismatch');
 const metadata={tempAlias,root,source,pin:PIN,node,pnpm,versions:{node:process.version,pnpm:'11.7.0',git:query('git',['--version'])}};
 writeFileSync(join(root,'.wisp-spike.json'),JSON.stringify(metadata,null,2),{mode:0o600});
 const env=environment(root,pnpm,tempAlias), upstream=join(root,'upstream');
 command('git',['clone','--no-hardlinks','--no-checkout',source,upstream],root,env);
 command('git',['-C',upstream,'checkout','--detach',PIN],root,env);
 command(pnpm,['--version'],upstream,env);
 command(pnpm,['install','--frozen-lockfile','--store-dir',join(root,'cache/pnpm-store')],upstream,env);
 command(pnpm,['run','build'],upstream,env);
 cpSync(resolve('spike'),join(upstream,'wisp-spike'),{recursive:true});
 metadata.tsx=createRequire(join(upstream,'package.json')).resolve('tsx/esm');
 writeFileSync(join(root,'.wisp-spike.json'),JSON.stringify(metadata,null,2),{mode:0o600});
 console.log(JSON.stringify({prepared:true,...metadata}));
}
