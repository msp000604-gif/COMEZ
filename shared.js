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
export const mascot=`<svg class="art" viewBox="0 0 470 220" fill="none" aria-hidden="true"><path d="M20 163C105 224 360 190 447 139" stroke="#ed512c" stroke-width="32" opacity=".16" stroke-linecap="round"/><g stroke="#42281f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M88 98l9-14 14 7 12-12 14 9 12-10 13 13 15-7 7 17 14 6-5 16 9 13-12 12 1 16-17 3-9 14-16-5-13 10-12-10-16 4-6-16-15-6 4-17-8-12 12-13z" fill="#ed512c"/><path d="M113 119q12-7 18 0m19-2q10-7 17 0m-42 20q16 18 30-2M109 173l-12 20-17-1m81-22 15 19 15-4m-97-63-23 9-10-7m131-11 17-13"/><path d="M281 114q10 53 57 53t55-53z" fill="#faf4e9"/><ellipse cx="337" cy="111" rx="56" ry="16"/><path d="M294 109q20-21 35-1t32-3m-51 9q5-22 28-4m-12 26h1m20 0h1m-21 10q10 9 19-1m-27 19-6 29-16 1m54-29 9 26 16-3m-89-58-21 6-12-13m133 5 17-20m-51-28 18-58m-9 60 21-55M245 60q8-20 1-31m-13 34q-7-12-1-22"/></g><path d="m207 46 7-13 8 13 14 2-11 10 3 14-14-7-13 7 2-14-10-10z" fill="#ed512c"/></svg>`;
