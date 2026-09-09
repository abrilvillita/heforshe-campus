import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,SignJWT,exportJWK} from 'jose';
import worker,{type Env} from '../worker/index';
import {safeUrl,embedUrl,entitySchema,validateEntity,calendarText,makeEntity,makeBlock} from '../lib/editorial/model';
import {demoContent} from '../lib/editorial/seed';
import {requireOrigin,readJson,sniffMedia,authorize} from '../worker/security';

test('rejects active URLs, embedded credentials and arbitrary iframe providers',()=>{for(const u of ['javascript:alert(1)','data:text/html,x','http://site.test','https://user:pass@site.test'])assert.equal(safeUrl(u),false);assert.equal(embedUrl('https://evil.test/form','form'),null);assert.equal(embedUrl('https://www.canva.com.evil.test/design/id/view','canva'),null);assert.ok(embedUrl('https://www.canva.com/design/ABC123/view','canva'))});
test('production rejects demo data URLs and unknown fields',()=>{const e=makeEntity('post');e.image='data:image/png;base64,aGVsbG8=';assert.throws(()=>validateEntity(e));assert.doesNotThrow(()=>validateEntity(e,true));assert.equal(entitySchema.safeParse({...makeEntity('post'),script:'alert(1)'}).success,false)});
test('event time range and quiz answer index are validated',()=>{assert.equal(entitySchema.safeParse({...makeEntity('event'),date:'2026-09-09T10:00:00Z',end:'2026-09-09T09:00:00Z'}).success,false);assert.equal(entitySchema.safeParse({...makeEntity('game'),options:['a','b'],correct:2}).success,false)});
test('all editorial samples are valid',()=>{for(const e of demoContent.entities)entitySchema.parse(e)});
test('calendar escapes user content and preserves absolute event time',()=>{const e={...makeEntity('event'),title:'Uno\nEND:VEVENT,otro;texto',date:'2026-09-17T16:00:00-06:00',end:'2026-09-17T17:00:00-06:00'};const ics=calendarText(e);assert.ok(ics.includes('DTSTART:20260917T220000Z'));assert.ok(ics.includes('Uno\\nEND:VEVENT\\,otro\\;texto'));assert.equal(ics.split('\r\nEND:VEVENT').length,2)});
test('CSRF blocks missing or foreign origins',()=>{assert.throws(()=>requireOrigin(new Request('https://site.test/api'),{SITE_ORIGIN:'https://site.test'}));assert.throws(()=>requireOrigin(new Request('https://site.test/api',{headers:{Origin:'https://evil.test'}}),{SITE_ORIGIN:'https://site.test'}))});
test('payload size and MIME are checked',async()=>{await assert.rejects(readJson(new Request('https://site.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"text":"oversize"}'}),5));assert.equal(sniffMedia(new TextEncoder().encode('<svg onload="alert(1)">')),null);assert.equal(sniffMedia(new Uint8Array([255,216,255,0])),'image/jpeg')});
test('production API authorization and concurrent updates',async()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('migrations/0001_editorial.sql','utf8'));
 const adapter={prepare(sql:string){let args:any[]=[];return {bind(...v:any[]){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(statements:any[]){db.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}};
 const env={DB:adapter,MEDIA:{},ASSETS:{fetch:()=>new Response('page')},SITE_ORIGIN:'https://site.test',ACCESS_TEAM_DOMAIN:'heforshe-test.cloudflareaccess.com',ACCESS_AUD:'editorial-audience',EDITOR_EMAILS:'editor@example.test,publisher@example.test',PUBLISHER_EMAILS:'publisher@example.test',TURNSTILE_SECRET:'',RATE_LIMIT_SECRET:''} as unknown as Env;
 const {privateKey,publicKey}=await generateKeyPair('RS256');const jwk={...await exportJWK(publicKey),kid:'test-key'};const previousFetch=globalThis.fetch;
 globalThis.fetch=async(input:any)=>{if(String(input).includes('/cdn-cgi/access/certs'))return Response.json({keys:[jwk]});throw Error('Unexpected external request')};
 async function token(email='publisher@example.test',aud='editorial-audience',expiry='1h'){return new SignJWT({email}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer('https://heforshe-test.cloudflareaccess.com').setAudience(aud).setSubject('test-user').setIssuedAt().setExpirationTime(expiry).sign(privateKey)}
 async function request(path:string,method='GET',body?:unknown,jwt?:string){return worker.fetch(new Request('https://site.test'+path,{method,headers:{Origin:'https://site.test','Content-Type':'application/json',...(jwt?{'Cf-Access-Jwt-Assertion':jwt}:{})},...(body?{body:JSON.stringify(body)}:{})}),env)}
 try{
 assert.equal((await request('/api/admin/content')).status,401);
 assert.equal((await request('/api/admin/content','GET',undefined,await token('outsider@example.test'))).status,403);
 assert.equal((await request('/api/admin/content','GET',undefined,await token('editor@example.test','wrong-audience'))).status,403);
 assert.equal((await request('/api/admin/content','GET',undefined,await token('editor@example.test','editorial-audience','-1h'))).status,403);
 const jwt=await token();const e={...makeEntity('post'),title:'Private draft',blocks:[makeBlock('text')]};
 assert.equal((await request('/api/admin/entity','PUT',{entity:e,revision:0},jwt)).status,200);
 let data=await (await request('/api/content')).json() as any;assert.equal(data.entities.length,0);
 assert.equal((await request('/api/admin/entity','PUT',{entity:{...e,title:'Stale overwrite'},revision:0},jwt)).status,409);
 assert.equal((await request('/api/admin/entity','PUT',{entity:{...e,status:'published'},revision:1},await token('editor@example.test'))).status,403);
 assert.equal((await request('/api/admin/entity','PUT',{entity:{...e,status:'published'},revision:1},jwt)).status,200);
 data=await (await request('/api/content')).json() as any;assert.equal(data.entities[0].title,'Private draft');
 assert.equal((await request('/api/admin/entity','PUT',{entity:{...e,status:'trash'},revision:2},await token('editor@example.test'))).status,403);
 assert.equal((await request('/api/admin/entity','PUT',{entity:{...e,status:'trash'},revision:2},jwt)).status,200);
 data=await (await request('/api/content')).json() as any;assert.equal(data.entities.length,0);
 assert.equal((await request('/api/feedback','POST',{text:'hello',token:'fake'})).status,503);
 assert.equal((await request('/api/admin/feedback')).status,401);
 assert.equal((await request('/admin')).status,401);
 assert.equal((await worker.fetch(new Request('https://site.test/api/admin/content'),{...env,ACCESS_AUD:''})).status,503);
 }finally{globalThis.fetch=previousFetch;db.close()}
});
