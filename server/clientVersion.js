import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function buildClientVersion(env=process.env){
 const {version}=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 let revision=env.VERCEL_GIT_COMMIT_SHA?.slice(0,12);
 if(!revision){try{revision=execFileSync('git',['rev-parse','--short=12','HEAD'],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:['ignore','pipe','ignore'],timeout:2000}).toString().trim();}catch{revision='unknown';}}
 return `${version}+${revision}`;
}
