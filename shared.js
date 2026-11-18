export const cfg = globalThis.COMEZ_CONFIG || {};
export const configured = !!(cfg.supabaseUrl && cfg.supabasePublishableKey);
export const validStudent = s => /^s\d{7}$/.test(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export async function request(path, data, token, method='POST') {
 if(!configured) throw new Error('De database is nog niet gekoppeld. Het onderzoeksteam moet config.js instellen.');
 const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),20000);
 try {
 const headers={'apikey':cfg.supabasePublishableKey,'Content-Type':'application/json'};
 if(token) headers.Authorization=`Bearer ${token}`;
 else if(cfg.supabasePublishableKey.startsWith('eyJ')) headers.Authorization=`Bearer ${cfg.supabasePublishableKey}`;
 const r=await fetch(cfg.supabaseUrl.replace(/\/$/,'')+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal});
 const body=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(body.message||body.error_description||'Er ging iets mis. Probeer opnieuw.');
 return body;
 } catch(e) {if(e.name==='AbortError')throw new Error('Geen verbinding. Je antwoorden blijven in dit scherm. Probeer opnieuw.');throw e;} finally{clearTimeout(timer)}
}
export const rpc=(name,args,token)=>request('/rest/v1/rpc/'+name,args,token);
export function csv(rows) {
 if(!rows.length)return '';
 const cell=x=>{let s=typeof x==='object'&&x!==null?JSON.stringify(x):String(x??'');if(/^[=+@\-\t\r\n]/.test(s.trimStart()))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const keys=Object.keys(rows[0]);
 return '\uFEFF'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(';')).join('\r\n');
}
export function downloadCSV(rows,name){const url=URL.createObjectURL(new Blob([csv(rows)],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export const questions=[
 {id:'temporal',dimension:'Temporeel',text:'Had je voldoende tijd om rustig te eten?'},
 {id:'cognitive',dimension:'Cognitief',text:'Heb je tijdens het eten naar een scherm gekeken?'},
 {id:'physiological',dimension:'Fysiologisch',text:'Voelde je je aangenaam verzadigd na deze maaltijd?'},
 {id:'social',dimension:'Sociaal',text:'Heb je deze maaltijd samen met iemand gegeten?'},
 {id:'environmental',dimension:'Omgeving',text:'Vond je de plek waar je at aangenaam?'},
 {id:'affective',dimension:'Affectief',text:'Heb je van dit eetmoment genoten?'}
];
export const rotation=[[0,1,3],[2,4,5],[0,4,5],[1,2,3],[0,2,4]];
export function chosenQuestions(count,day,offset=0){return count===6?questions:rotation[(day-1+offset)%5].map(i=>questions[i]);}
export const mealOptions=['Zelf gekookt','Kookpakket','Kant-en-klaar opgewarmd','Afgehaald / bezorgd','Restaurant','Restjes','Anders','Geen avondmaaltijd'];
export const mascot=`<img class="art" src="comez-cartoons.png" alt="De zeven COMEZ-eetarchetypes" width="1336" height="1146" style="width:100%;max-width:450px;height:auto;object-fit:contain;display:block;margin:28px auto 0;">`;

