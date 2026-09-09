import {createRemoteJWKSet,jwtVerify} from 'jose';
export type IdentityEnv={ACCESS_TEAM_DOMAIN:string;ACCESS_AUD:string;EDITOR_EMAILS:string;PUBLISHER_EMAILS:string;SITE_ORIGIN:string};
export class HttpError extends Error { constructor(public status:number,message:string){super(message)} }
const keys=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export async function authorize(request:Request,env:IdentityEnv){
 if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.EDITOR_EMAILS)throw new HttpError(503,'El acceso editorial aún no está configurado.');
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))throw new HttpError(503,'Configuración de identidad inválida.');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)throw new HttpError(401,'Inicia sesión con tu cuenta editorial.');
 const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
 if(!keys.has(issuer))keys.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
 try {const {payload}=await jwtVerify(token,keys.get(issuer)!,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
 const email=String(payload.email).toLowerCase();const list=(s:string)=>s.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);
 if(!list(env.EDITOR_EMAILS).includes(email))throw Error('not allowed');return {email,publisher:list(env.PUBLISHER_EMAILS||'').includes(email)};
 }catch{throw new HttpError(403,'Esta cuenta no tiene acceso editorial válido.');}
}
export function requireOrigin(request:Request,env:Pick<IdentityEnv,'SITE_ORIGIN'>){
 if(!env.SITE_ORIGIN||request.headers.get('Origin')!==env.SITE_ORIGIN)throw new HttpError(403,'Origen no permitido.');
}
export async function readJson(request:Request,max=350000){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new HttpError(415,'Se requiere JSON.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Contenido vacío.');let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new HttpError(413,'Contenido demasiado grande.')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw new HttpError(400,'JSON inválido.')}
}
export function sniffMedia(bytes:Uint8Array){
 const text=new TextDecoder().decode(bytes.slice(0,32));
 if(bytes[0]===137&&text.slice(1,4)==='PNG')return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(text.startsWith('RIFF')&&text.slice(8,12)==='WEBP')return 'image/webp';
 if(text.slice(4,8)==='ftyp')return 'video/mp4';
 if(bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return 'video/webm';
 return null;
}
