import {entitySchema,settingsSchema,defaultSettings,isVisible,type Entity} from '../lib/editorial/model';
import {authorize,HttpError,readJson,requireOrigin,sniffMedia,type IdentityEnv} from './security';
import {z} from 'zod';
export interface Env extends IdentityEnv {DB:D1Database;MEDIA:R2Bucket;ASSETS:Fetcher;TURNSTILE_SECRET:string;TURNSTILE_SITE_KEY:string;RATE_LIMIT_SECRET:string}
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const empty=(status:number,message:string)=>json({error:message},status);
async function audit(env:Env,actor:string,action:string,id=''){await env.DB.prepare('INSERT INTO audit VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,id,new Date().toISOString()).run()}
async function state(env:Env,admin=false){
 const settings=await env.DB.prepare('SELECT settings,revision FROM content WHERE id=1').first<{settings:string;revision:number}>();
 const result=await env.DB.prepare(admin?'SELECT payload FROM entities ORDER BY updated_at DESC':"SELECT payload FROM entities WHERE status='published' ORDER BY updated_at DESC").all<{payload:string}>();
 return {settings:settings?JSON.parse(settings.settings):defaultSettings,revision:settings?.revision||0,entities:result.results.map(r=>JSON.parse(r.payload) as Entity).filter(e=>admin||isVisible(e))};
}
async function checkMedia(env:Env,e:Entity){const values=[e.image,...e.blocks.map(b=>b.url),...e.pages.flatMap(p=>p.blocks.map(b=>b.url)),...e.members.map(m=>m.image)];for(const url of new Set(values)){if(url.startsWith('/api/media/')){const m=await env.DB.prepare('SELECT id FROM media WHERE id=?').bind(url.split('/').pop()).first();if(!m)throw new HttpError(400,'El archivo no está disponible. Vuelve a subirlo.')}}}
async function route(request:Request,env:Env):Promise<Response>{
 const u=new URL(request.url),p=u.pathname;
 if(p==='/api/health')return json({configured:!!(env.DB&&env.MEDIA&&env.ACCESS_AUD),feedback:!!(env.TURNSTILE_SECRET&&env.RATE_LIMIT_SECRET),turnstileSiteKey:env.TURNSTILE_SITE_KEY||''});
 if(p==='/admin'||p.startsWith('/admin/')){await authorize(request,env);return env.ASSETS.fetch(request);}
 if(!p.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(!env.DB)throw new HttpError(503,'La base de datos aún no está conectada.');
 if(p==='/api/content'&&request.method==='GET')return json(await state(env));
 if(p.startsWith('/api/admin/')){
   const user=await authorize(request,env);
   if(request.method!=='GET')requireOrigin(request,env);
   if(p==='/api/admin/session'&&request.method==='GET')return json(user);
   if(p==='/api/admin/content'&&request.method==='GET')return json(await state(env,true));
   if(p==='/api/admin/entity'&&request.method==='PUT'){
     const data=z.object({entity:entitySchema,revision:z.number().int().nonnegative()}).strict().parse(await readJson(request));
     const e=data.entity;const previous=await env.DB.prepare('SELECT status FROM entities WHERE id=?').bind(e.id).first<{status:string}>();
     if(!user.publisher&&(e.status==='published'||previous?.status==='published'))throw new HttpError(403,'Solo una publicadora puede modificar contenido publicado.');
     await checkMedia(env,e);await env.DB.prepare('INSERT OR IGNORE INTO content VALUES(1,?,0)').bind(JSON.stringify(defaultSettings)).run();
     // The revision check and data write run as one transaction; a stale editor cannot overwrite another.
     const result=await env.DB.batch([
       env.DB.prepare('INSERT INTO entities(id,kind,status,payload,updated_at) SELECT ?,?,?,?,? WHERE (SELECT revision FROM content WHERE id=1)=? ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,status=excluded.status,payload=excluded.payload,updated_at=excluded.updated_at').bind(e.id,e.kind,e.status,JSON.stringify(e),new Date().toISOString(),data.revision),
       env.DB.prepare('UPDATE content SET revision=revision+1 WHERE id=1 AND revision=?').bind(data.revision),
     ]);if(!result[0].meta.changes)throw new HttpError(409,'Otra compañera guardó cambios. Recarga antes de guardar.');await audit(env,user.email,'save:'+e.status,e.id);return json(await state(env,true));
   }
   if(p==='/api/admin/settings'&&request.method==='PUT'){
     if(!user.publisher)throw new HttpError(403,'Solo una publicadora puede cambiar la portada.');
     const data=z.object({settings:settingsSchema,revision:z.number().int().nonnegative()}).strict().parse(await readJson(request));
     await env.DB.prepare('INSERT OR IGNORE INTO content VALUES(1,?,0)').bind(JSON.stringify(defaultSettings)).run();
     const result=await env.DB.prepare('UPDATE content SET settings=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data.settings),data.revision).run();if(!result.meta.changes)throw new HttpError(409,'Hay cambios nuevos. Recarga el panel.');await audit(env,user.email,'settings');return json(await state(env,true));
   }
   if(p==='/api/admin/media'&&request.method==='POST'){
     if(!env.MEDIA)throw new HttpError(503,'Almacenamiento no configurado.');
     const size=Number(request.headers.get('Content-Length'));if(!size||size>15*1024*1024)throw new HttpError(413,'Máximo 15 MB por archivo.');
     const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Archivo vacío.');const parts:Uint8Array[]=[];let total=0;
     while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>15*1024*1024){await reader.cancel();throw new HttpError(413,'Archivo demasiado grande.')}parts.push(value)}
     const bytes=new Uint8Array(total);let cursor=0;for(const part of parts){bytes.set(part,cursor);cursor+=part.length}const mime=sniffMedia(bytes);if(!mime||mime!==request.headers.get('Content-Type'))throw new HttpError(415,'Solo PNG, JPG, WebP, MP4 o WebM válidos.');
     const id=crypto.randomUUID();await env.MEDIA.put(id,bytes,{httpMetadata:{contentType:mime}});await env.DB.prepare('INSERT INTO media VALUES(?,?,?,?,?)').bind(id,mime,total,user.email,new Date().toISOString()).run();return json({url:'/api/media/'+id},201);
   }
   if(p==='/api/admin/feedback'&&request.method==='GET')return json((await env.DB.prepare('SELECT id,text,state,created_at FROM feedback ORDER BY created_at DESC LIMIT 200').all()).results);
   if(p==='/api/admin/feedback'&&request.method==='PATCH') {const d=z.object({id:z.string().uuid(),state:z.enum(['new','read','archived'])}).strict().parse(await readJson(request));await env.DB.prepare('UPDATE feedback SET state=? WHERE id=?').bind(d.state,d.id).run();return json({ok:true})}
   return empty(404,'No encontrado.');
 }
 if(p.startsWith('/api/media/')&&request.method==='GET'){
   const id=p.slice('/api/media/'.length);if(!z.string().uuid().safeParse(id).success)throw new HttpError(404,'Archivo no encontrado.');
   const content=await state(env);const url='/api/media/'+id;const linked=content.entities.some(e=>[e.image,...e.blocks.map(b=>b.url),...e.pages.flatMap(pg=>pg.blocks.map(b=>b.url)),...e.members.map(m=>m.image)].includes(url));
   if(!linked)await authorize(request,env);
   const obj=await env.MEDIA.get(id);if(!obj)throw new HttpError(404,'Archivo no encontrado.');const headers=new Headers({'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'private,no-store'});return new Response(obj.body,{headers});
 }
 if(p==='/api/feedback'&&request.method==='POST'){
   requireOrigin(request,env);if(!env.TURNSTILE_SECRET||!env.RATE_LIMIT_SECRET)throw new HttpError(503,'El buzón todavía no está habilitado.');
   const data=z.object({text:z.string().trim().min(3).max(1200),token:z.string().min(1).max(2048),website:z.string().max(100).default('')}).strict().parse(await readJson(request,8000));
   if(data.website)return json({ok:true});
   const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:data.token})});
   const check=await verify.json() as {success:boolean;hostname:string;action:string};if(!check.success||check.hostname!==new URL(env.SITE_ORIGIN).hostname||check.action!=='feedback')throw new HttpError(400,'Completa de nuevo la verificación.');
   const hour=Math.floor(Date.now()/3600000);const raw=new TextEncoder().encode((request.headers.get('CF-Connecting-IP')||'unknown')+':'+hour);
   const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.RATE_LIMIT_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);const hash=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,raw))).map(x=>x.toString(16).padStart(2,'0')).join('');
   const count=await env.DB.prepare('INSERT INTO rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(hash,Date.now()+7200000).first<{count:number}>();if((count?.count||0)>5)throw new HttpError(429,'Ya recibimos varias ideas. Intenta más tarde.');
   await env.DB.prepare('INSERT INTO feedback(id,text,created_at) VALUES(?,?,?)').bind(crypto.randomUUID(),data.text,new Date().toISOString()).run();return json({ok:true},201);
 }
 return empty(404,'No encontrado.');
}
export default {async fetch(request:Request,env:Env){try{const response=await route(request,env);const r=new Response(response.body,response);r.headers.set('X-Content-Type-Options','nosniff');r.headers.set('Referrer-Policy','strict-origin-when-cross-origin');r.headers.set('X-Frame-Options','DENY');r.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');return r}catch(e){if(e instanceof HttpError)return empty(e.status,e.message);if(e instanceof z.ZodError)return empty(400,e.issues[0]?.message||'Datos inválidos.');return empty(500,'No se pudo completar la operación.');}},async scheduled(_event:unknown,env:Env){await env.DB.prepare('DELETE FROM rate_limits WHERE expires < ?').bind(Date.now()).run();await env.DB.prepare("DELETE FROM feedback WHERE created_at < datetime('now','-90 days')").run();}};
