import { z } from 'zod';

export const sections = ['HeForShe','Athletics','eSports','Educación en campus','Arte y Cultura','Impacto Social','Grupos Estudiantiles','Comunicación','Eventos','El mundo'];
export function safeUrl(value: string): boolean {
  if (/^\/api\/media\/[a-f0-9-]{36}$/.test(value)) return true;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
export function safeMediaUrl(value:string){return safeUrl(value)||/^data:(image\/(png|jpeg|webp)|video\/(mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(value)}
export function validateEntity(value:Entity,demo=false){
 const copy=structuredClone(value);
 if(demo){const clean=(s:string)=>s.startsWith('data:')&&safeMediaUrl(s)?'https://demo.invalid/media':s;
 copy.image=clean(copy.image);copy.blocks=copy.blocks.map(b=>({...b,url:clean(b.url)}));copy.pages=copy.pages.map(p=>({...p,blocks:p.blocks.map(b=>({...b,url:clean(b.url)}))}));copy.members=copy.members.map(m=>({...m,image:clean(m.image)}));}
 const result=entitySchema.safeParse(copy);if(!result.success)throw Error(result.error.issues[0].message);return demo?value:result.data;
}
const url = z.string().max(2048).refine(v => !v || safeUrl(v), 'Usa un enlace HTTPS válido.');
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const blockSchema = z.object({
  id:z.string().min(1).max(80), type:z.enum(['heading','text','quote','image','video','link','form','canva','divider']),
  text:z.string().max(12000).default(''), url:url.default(''), alt:z.string().max(300).default(''),
  font:z.enum(['serif','sans','mono']).default('serif'), size:z.number().int().min(16).max(64).default(18),
  bold:z.boolean().default(false), italic:z.boolean().default(false), align:z.enum(['left','center','right']).default('left'),
  color:color.default('#30212b'), background:color.default('#fff9fc'), width:z.enum(['full','half','third']).default('full'),
  spacing:z.number().int().min(0).max(48).default(16),
}).strict();
export type Block=z.infer<typeof blockSchema>;
export const entitySchema=z.object({
  id:z.string().uuid(), kind:z.enum(['post','issue','event','generation','social','game']),
  title:z.string().trim().min(1).max(140), status:z.enum(['draft','review','published','trash']).default('draft'),
  section:z.string().max(60).default('HeForShe'), date:z.string().max(35).default(''), end:z.string().max(35).default(''),
  location:z.string().max(200).default(''), description:z.string().max(1000).default(''), author:z.string().max(100).default('Equipo HeForShe'),
  url:url.default(''), image:url.default(''), blocks:z.array(blockSchema).max(80).default([]),
  pages:z.array(z.object({title:z.string().max(100),blocks:z.array(blockSchema).max(50)}).strict()).max(24).default([]),
  members:z.array(z.object({name:z.string().min(1).max(100),role:z.string().max(100),image:url,instagram:url,linkedin:url}).strict()).max(40).default([]),
  gameType:z.enum(['quiz','memory']).default('quiz'), options:z.array(z.string().min(1).max(200)).max(8).default([]),
  correct:z.number().int().min(0).max(7).default(0), explanation:z.string().max(1000).default(''),
  popup:z.boolean().default(false), number:z.number().int().min(1).max(9999).default(1),
}).strict().superRefine((v,ctx)=>{
  if(v.kind==='event'&&(!v.date||!v.end||!Number.isFinite(Date.parse(v.date))||Date.parse(v.end)<=Date.parse(v.date)))ctx.addIssue({code:'custom',message:'El evento necesita inicio y fin válidos; el fin debe ser posterior.'});
  if(v.kind==='game'&&(v.options.length<2||v.correct>=v.options.length))ctx.addIssue({code:'custom',message:'Agrega al menos dos opciones y selecciona una respuesta válida.'});
});
export type Entity=z.infer<typeof entitySchema>;
export const settingsSchema=z.object({
  welcome:z.string().trim().min(1).max(400), campus:z.string().max(100), editionDate:z.string().max(40),
  instagram:url,tiktok:url,networks:z.array(z.object({label:z.string().trim().min(1).max(40),url}).strict()).max(12).default([]),sections:z.array(z.string().trim().min(1).max(60)).min(1).max(20),
  banner:z.string().max(160),bannerTarget:z.enum(['periodico','buzon','agenda','juegos']),
}).strict();
export type Settings=z.infer<typeof settingsSchema>;
export type Content={settings:Settings;entities:Entity[];revision:number};
export const defaultSettings:Settings={welcome:'No tienes que tener todas las respuestas para empezar a hacer la diferencia.',campus:'Tecmilenio · Campus Laguna',editionDate:'SEPTIEMBRE 2026',instagram:'https://www.instagram.com/heforshe_laguna/',tiktok:'https://www.tiktok.com/@heforshe2025',networks:[],sections,banner:'Nuestra historia también se escribe aquí. Descubre el periódico.',bannerTarget:'periodico'};
export function makeBlock(type:Block['type']='text'):Block { return blockSchema.parse({id:crypto.randomUUID(),type}); }
export function makeEntity(kind:Entity['kind']):Entity { return {id:crypto.randomUUID(),kind,title:'Sin título',status:'draft',section:'HeForShe',date:'',end:'',location:'',description:'',author:'Equipo HeForShe',url:'',image:'',blocks:[],pages:[],members:[],gameType:'quiz',options:[],correct:0,explanation:'',popup:false,number:1}; }
export function isVisible(e:Entity,now=Date.now()) { return e.status==='published'&&(e.kind!=='game'||((!e.date||Date.parse(e.date)<=now)&&(!e.end||Date.parse(e.end)>=now))); }
export function embedUrl(value:string,type:Block['type']):string|null {
  if(!safeUrl(value))return null;const u=new URL(value,'https://local.invalid');
  if(type==='canva'&&u.hostname==='www.canva.com'&&/^\/design\/[\w-]+(?:\/[\w-]+)?\/view$/.test(u.pathname))return u.origin+u.pathname+'?embed';
  if(type==='form'&&u.hostname==='docs.google.com'&&/^\/forms\/d\/e\/[\w-]+\/viewform$/.test(u.pathname))return u.origin+u.pathname+'?embedded=true';
  if(type==='video'&&(u.hostname==='www.youtube.com'||u.hostname==='youtu.be')) {const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v');if(id&&/^[\w-]{11}$/.test(id))return 'https://www.youtube-nocookie.com/embed/'+id;}
  if(type==='video'&&['www.tiktok.com','tiktok.com'].includes(u.hostname)){const id=u.pathname.match(/\/video\/(\d+)$/)?.[1];if(id)return 'https://www.tiktok.com/player/v1/'+id+'?autoplay=0';}
  return null;
}
export function calendarText(e:Entity):string {
 const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
 const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HeForShe//Entre nos//ES','BEGIN:VEVENT',`UID:${e.id}@heforshe`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(e.date)}`,`DTEND:${stamp(e.end)}`,`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.location)}`,`DESCRIPTION:${escape(e.description)}`,'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:Recordatorio HeForShe','END:VALARM','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
