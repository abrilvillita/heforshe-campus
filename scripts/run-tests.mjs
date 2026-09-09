import ts from 'typescript';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const files=['lib/editorial/model.ts','lib/editorial/seed.ts','worker/security.ts','worker/index.ts','tests/security.test.ts'];
for(const file of files){const dest=resolve('work/test-build',file.replace(/\.ts$/,'.js'));await mkdir(dirname(dest),{recursive:true});const source=await readFile(file,'utf8');await writeFile(dest,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText);}
await writeFile('work/test-build/package.json','{"type":"commonjs"}');
const result=spawnSync(process.execPath,['--test','work/test-build/tests/security.test.js'],{stdio:'inherit'});process.exit(result.status??1);
