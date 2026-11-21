import {configured,esc,request,rpc,downloadCSV,today,validStudent} from './shared.js?v=4';
const app=document.querySelector('#app');let access='',rows=[],bank=[];
function error(e){document.querySelector('#status').className='error';document.querySelector('#status').textContent=e.message||e;}
const status='<p role="status" id="status" aria-live="polite"></p>';
function login(){app.innerHTML=`<section class="study card"><span class="eyebrow">Onderzoeksteam</span><h1>Welkom terug.</h1><p>Beheer deelnemers, wijs een vragenvariant toe en download de antwoorden.</p>${!configured?'<div class="banner">Vul eerst de Supabase-gegevens in config.js in. Zie START_HIER.md in het downloadpakket.</div>':''}<form id="login"><label for="email">E-mailadres beheerder</label><input id="email" name="email" type="email" autocomplete="username" required><label for="password">Wachtwoord</label><input id="password" name="password" type="password" autocomplete="current-password" required><button class="wide" ${!configured?'disabled':''}>Inloggen →</button>${status}</form></section>`;
 document.querySelector('form').onsubmit=async e=>{e.preventDefault();e.submitter.disabled=true;try{const r=await request('/auth/v1/token?grant_type=password',{email:e.target.email.value,password:e.target.password.value});access=r.access_token;await load();}catch(e){error(e);document.querySelector('button').disabled=false}};}
async function api(action,payload={}){return rpc('comez_admin',{p_action:action,p_payload:payload},access)}
async function load(){[rows,bank]=await Promise.all([api('list'),api('questions')]);render()}
function render(){app.innerHTML=`<div class="meta"><div><span class="eyebrow">COMEZ / Onderzoeksdashboard</span><h1>Een blik aan tafel.</h1><p>${rows.length} deelnemers · ${rows.reduce((n,r)=>n+r.completed,0)} afgeronde dagregistraties</p></div><button class="secondary" id="logout">Uitloggen</button></div>${status}<div class="admin-grid"><section class="card"><h2 id="participant-title">Deelnemer instellen</h2><p class="note" id="participant-note">Voeg een deelnemer toe, of klik op Bewerk in de lijst om diens instellingen aan te passen.</p><form id="participant"><label for="student">Studentennummer</label><input id="student" name="student" placeholder="s0230539" pattern="[sS][0-9]{7}" maxlength="8" required><label for="count">Aantal kwaliteitsvragen per dag</label><select id="count" name="count"><option value="3">Groep A · 3 schuifvragen</option><option value="4">Groep B · 4 schuifvragen</option><option value="6">Groep C · 6 schuifvragen</option><option value="12">Groep D · 12 schuifvragen</option></select><label for="start">Startdatum (Belgische tijd)</label><input id="start" name="start" type="date" value="${today()}" required><label for="offset">Rotatiestart (0 = standaard)</label><select id="offset" name="offset">${[0,1,2,3,4].map(i=>`<option value="${i}">Startpositie ${i}</option>`).join('')}</select><button class="wide" id="participant-save">Deelnemer opslaan</button><button class="secondary wide" id="new-participant" type="button" hidden>Nieuwe deelnemer / bewerken annuleren</button></form><div id="invite" aria-live="polite"></div></section><section class="card"><div class="meta"><h2>Deelnemers</h2><button id="reload" class="secondary small">Vernieuwen</button></div><div class="table-wrap"><table><thead><tr><th>Nummer</th><th>Groep / vragen</th><th>Start</th><th>Dagen klaar</th><th>Actie</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.student_number)}</td><td>${esc(r.instrument==='slider_v2'?({3:'A',4:'B',6:'C',12:'D'}[r.question_count])+' · '+r.question_count:'Oud ja/nee · '+r.question_count)}</td><td>${esc(r.start_date)}</td><td>${r.completed} / 5</td><td><div class="participant-actions"><button type="button" class="secondary edit" data-id="${esc(r.student_number)}" aria-pressed="false" aria-label="Bewerk deelnemer ${esc(r.student_number)}">Bewerk</button><button type="button" class="secondary delete-participant" data-id="${esc(r.student_number)}" aria-label="Deelnemer ${esc(r.student_number)} verwijderen">Verwijder</button></div></td></tr>`).join('')||'<tr><td colspan="5">Voeg je eerste deelnemer toe.</td></tr>'}</tbody></table></div><h3>Van antwoorden naar inzicht</h3><p class="note">Eén rij per beantwoorde vraag, met studentennummer, groep, studiedag, dimensie, vraagtekst, antwoord en tijdstippen. Inclusief onvoltooide registraties. Schuifvragen hebben een numerieke kolom score_0_100 en beide adjectieven. instrument onderscheidt oude ja/nee-metingen en nieuwe sliders.</p><button id="export">Download antwoorden · CSV ↓</button><button id="export-days" class="secondary wide">Download dagen & invulduur · CSV ↓</button><p class="note">CSV opent in Excel. Bewaar exports buiten de openbare repository. Na een verlopen beheersessie opnieuw inloggen.</p></section></div>${questionEditor()}${deleteDialog()}`;
 bindQuestionEditor();
 bindParticipantDelete();
 bindParticipantEditor();
 document.querySelector('#logout').onclick=()=>{access='';rows=[];login()};document.querySelector('#reload').onclick=()=>load().catch(error);
 for(const [id,action,file] of [['export','export','COMEZ_antwoorden'],['export-days','days','COMEZ_dagregistraties']])document.querySelector('#'+id).onclick=async e=>{e.target.disabled=true;try{const data=await api(action);if(!data.length)throw new Error('Er zijn nog geen gegevens om te exporteren.');downloadCSV(data,file+'_'+today()+'.csv')}catch(e){error(e)}finally{e.target.disabled=false}};
}

const dimensions=['Temporeel','Cognitief','Fysiologisch','Sociaal','Omgeving','Affectief'];
function questionEditor(){const active=bank.filter(q=>q.active).length;return `<section class="card question-bank"><span class="eyebrow">Jouw onderzoek, jouw woorden</span><h2>Adjectiefvragen beheren</h2><div class="banner">${active} / 12 actieve vragen. ${active===12?'De vragenbank is klaar om nieuwe deelnemers te laten starten.':'Maak precies 12 vragen actief voordat studenten starten.'}</div><p>Elke vraag bestaat uit een zin met twee tegengestelde omschrijvingen. Studenten antwoorden tussen 0 en 100. De vragenbank wordt bij de eerste deelname voor die student vastgezet; wijzigingen gelden voor wie daarna begint.</p><p class="note">De volgorde bepaalt de rotatie. Zet bijvoorbeeld eerst één vraag per dimensie, daarna een tweede ronde van zes. Deelnemers krijgen dagelijks de volgende 3, 4, 6 of 12 vragen uit deze reeks. De maaltijdvragen en reflectie komen daar nog bij.</p><div class="admin-grid"><form id="question-form"><input type="hidden" name="id"><label for="q-text">Vraag of inleidende zin</label><input id="q-text" name="text" maxlength="300" value="Hoe ervoer je dit eetmoment?" required><label for="q-left">Links · 0%</label><input id="q-left" name="left" maxlength="80" placeholder="Bijvoorbeeld: gehaast" required><label for="q-right">Rechts · 100%</label><input id="q-right" name="right" maxlength="80" placeholder="Bijvoorbeeld: rustig" required><label for="q-dimension">Dimensie</label><select id="q-dimension" name="dimension">${dimensions.map(d=>`<option>${d}</option>`).join('')}</select><label for="q-order">Volgorde</label><input id="q-order" name="order" type="number" min="1" max="999" value="${bank.length+1}" required><label class="inline"><input type="checkbox" name="active" checked><span>Actief voor nieuwe deelnemers</span></label><div class="actions"><button>Vraag opslaan →</button><button type="button" class="secondary" id="new-question">Nieuwe vraag</button></div><p id="question-status" role="status" aria-live="polite"></p></form><div><div class="dimension-counts">${dimensions.map(d=>`<span class="pill">${d}: ${bank.filter(q=>q.active&&q.dimension===d).length}</span>`).join('')}</div><div class="table-wrap"><table><thead><tr><th>Volgorde</th><th>Adjectieven · dimensie</th><th>Status</th><th></th></tr></thead><tbody>${[...bank].sort((a,b)=>a.sort_order-b.sort_order||a.id.localeCompare(b.id)).map(q=>`<tr><td>${q.sort_order}</td><td>${esc(q.left_label)} ↔ ${esc(q.right_label)}<br><small>${esc(q.dimension)}</small></td><td>${q.active?'Actief':'Inactief'}</td><td><button class="secondary edit-question" data-id="${esc(q.id)}">Bewerk</button></td></tr>`).join('')||'<tr><td colspan="4">Nog geen adjectiefvragen. Voeg jouw eerste vraag toe.</td></tr>'}</tbody></table></div><p class="note">Deactiveer een vraag om ze uit een toekomstige meting te halen. Reeds toegewezen vragen en antwoorden blijven bewaard. Voorbeeldadjectieven zijn geen gevalideerde meetschaal.</p></div></div></section>`;}
function bindQuestionEditor(){const f=document.querySelector('#question-form');document.querySelector('#new-question').onclick=()=>{f.reset();f.elements.id.value='';f.elements.order.value=bank.length+1;f.elements.left.focus();};document.querySelectorAll('.edit-question').forEach(b=>b.onclick=()=>{const q=bank.find(q=>q.id===b.dataset.id);for(const [field,value] of Object.entries({id:q.id,text:q.question_text,left:q.left_label,right:q.right_label,dimension:q.dimension,order:q.sort_order}))f.elements.namedItem(field).value=value;f.elements.active.checked=q.active;f.scrollIntoView({behavior:'smooth',block:'center'});});f.onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;const values=Object.fromEntries(new FormData(f));try{await api('save_question',{...values,order:Number(values.order),active:f.elements.active.checked});await load();document.querySelector('#question-status').textContent='Vraag opgeslagen. Je kunt de volgende toevoegen.';document.querySelector('#question-form').scrollIntoView({block:'center'});}catch(e){const status=document.querySelector('#question-status');status.className='error';status.textContent=e.message;b.disabled=false;}};}

function deleteDialog(){return `<dialog id="delete-dialog" class="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description"><form id="delete-form"><h2 id="delete-title">Deelnemer verwijderen?</h2><p>Je verwijdert <code id="delete-student"></code>.</p><p id="delete-description">De deelnemer, deelnamecode, alle dagregistraties en alle antwoorden worden definitief verwijderd. Dit kun je niet ongedaan maken.</p><p class="note">Download eerst een antwoordenexport als je de gegevens nog nodig hebt.</p><label for="delete-confirmation">Typ het studentennummer opnieuw ter bevestiging.</label><input id="delete-confirmation" name="confirmation" type="text" pattern="[sS][0-9]{7}" maxlength="8" autocomplete="off" autocapitalize="none" spellcheck="false" required><p id="delete-status" class="error" role="alert" tabindex="-1" hidden></p><div class="actions"><button id="delete-cancel" type="button" class="secondary">Annuleren</button><button id="delete-submit" type="submit" class="danger" disabled>Definitief verwijderen</button></div></form></dialog>`;}

function participantGroupOptions(legacy=false){
 const groups=legacy?[[3,'Oud A · 3 ja/nee-vragen'],[6,'Oud B · 6 ja/nee-vragen']]:[[3,'Groep A · 3 schuifvragen'],[4,'Groep B · 4 schuifvragen'],[6,'Groep C · 6 schuifvragen'],[12,'Groep D · 12 schuifvragen']];
 return groups.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
}

function bindParticipantEditor(){
 const form=document.querySelector('#participant');
 const field=name=>form.elements.namedItem(name);
 const title=document.querySelector('#participant-title');
 const note=document.querySelector('#participant-note');
 const save=document.querySelector('#participant-save');
 const reset=document.querySelector('#new-participant');
 function resetEditor(){
  form.reset();delete form.dataset.editing;
  field('student').readOnly=false;field('start').disabled=false;
  field('count').innerHTML=participantGroupOptions();
  field('start').value=today();field('offset').value='0';
  title.textContent='Deelnemer instellen';
  note.textContent='Voeg een deelnemer toe, of klik op Bewerk in de lijst om diens instellingen aan te passen.';
  save.textContent='Deelnemer opslaan';reset.hidden=true;
  document.querySelectorAll('.edit').forEach(b=>b.setAttribute('aria-pressed','false'));
 }
 reset.onclick=()=>{resetEditor();field('student').focus();};
 document.querySelectorAll('.edit').forEach(button=>button.onclick=()=>{
  const participant=rows.find(r=>r.student_number===button.dataset.id);
  if(!participant){error(new Error('Vernieuw de deelnemerslijst en selecteer opnieuw.'));return;}
  const started=Number(participant.started??participant.completed)>0;
  const legacy=started&&participant.instrument==='yesno_v1';
  form.dataset.editing=participant.student_number;
  field('student').value=participant.student_number;field('student').readOnly=true;
  field('count').innerHTML=participantGroupOptions(legacy);
  field('count').value=String(participant.question_count);
  field('start').value=participant.start_date;field('start').disabled=started;
  field('offset').value=String(participant.rotation_offset);
  title.textContent='Deelnemer bewerken';
  note.textContent=`Je bewerkt ${participant.student_number}. ${started?'Groep en rotatie gelden voor nieuwe dagregistraties. Reeds geopende dagen blijven hetzelfde. De startdatum staat vast om bestaande registraties correct te houden.':'Je kunt de groep, startdatum en rotatie aanpassen.'}${legacy?' Deze deelnemer blijft de oude ja/nee-vragen gebruiken.':''}`;
  save.textContent='Wijzigingen opslaan';reset.hidden=false;
  document.querySelectorAll('.edit').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  form.scrollIntoView({behavior:'smooth',block:'center'});field('count').focus({preventScroll:true});
 });
 form.onsubmit=async e=>{
  e.preventDefault();const button=e.submitter;button.disabled=true;
  try{
   const student=field('student').value.trim().toLowerCase();
   if(!validStudent(student))throw new Error('Ongeldig studentennummer.');
   if(form.dataset.editing&&student!==form.dataset.editing)throw new Error('Annuleer het bewerken om een ander studentennummer toe te voegen.');
   const result=await api('upsert',{student,count:Number(field('count').value),start:field('start').value,offset:Number(field('offset').value)});
   await load();
   const box=document.querySelector('#invite');box.className='banner';
   if(result.code){
    box.innerHTML=`<strong>Deelnemer aangemaakt.</strong><p>Deel deze gegevens privé. De code wordt maar één keer getoond.</p><p>${esc(student)}<br><code>${esc(result.code)}</code></p><p class="note">Studielink: ${esc(new URL('index.html',location.href).href)}</p>`;
   }else{
    box.textContent=`Instellingen van ${student} opgeslagen. ${result.started?'De nieuwe groep en rotatie gelden zodra de deelnemer een nieuwe studiedag opent. ':''}De bestaande deelnamecode blijft geldig.`;
   }
   box.tabIndex=-1;box.focus();
  }catch(e){error(e);button.disabled=false;}
 };
}

function bindParticipantDelete(){
 const dialog=document.querySelector('#delete-dialog');
 const form=document.querySelector('#delete-form');
 const input=document.querySelector('#delete-confirmation');
 const confirm=document.querySelector('#delete-submit');
 const cancel=document.querySelector('#delete-cancel');
 const message=document.querySelector('#delete-status');
 let student='',busy=false;
 const update=()=>{confirm.disabled=busy||input.value.trim().toLowerCase()!==student;};
 document.querySelectorAll('.delete-participant').forEach(button=>button.onclick=()=>{
  student=button.dataset.id;
  document.querySelector('#delete-student').textContent=student;
  form.reset();message.hidden=true;message.textContent='';busy=false;
  dialog.removeAttribute('aria-busy');cancel.disabled=false;
  confirm.textContent='Definitief verwijderen';update();
  dialog.showModal();input.focus();
 });
 input.addEventListener('input',update);
 cancel.onclick=()=>{if(!busy)dialog.close();};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 form.onsubmit=async e=>{
  e.preventDefault();
  if(busy||input.value.trim().toLowerCase()!==student)return;
  busy=true;update();cancel.disabled=true;message.hidden=true;
  dialog.setAttribute('aria-busy','true');confirm.textContent='Bezig met verwijderen…';
  try{
   await rpc('comez_delete_participant',{p_student:student,p_confirmation:input.value.trim()},access);
   dialog.close();rows=rows.filter(r=>r.student_number!==student);render();
   const notice=document.querySelector('#status');
   notice.className='banner';notice.textContent=`Deelnemer ${student} en alle bijbehorende antwoorden zijn verwijderd.`;
   notice.tabIndex=-1;notice.focus();
  }catch(e){
   let text=e.message||'Verwijderen is niet gelukt.';
   if(/could not find.*comez_delete_participant|function.*comez_delete_participant.*does not exist/i.test(text))text='Voer eerst update_deelnemers_beheer.sql uit in Supabase en probeer opnieuw.';
   if(text.startsWith('Geen verbinding.'))text='Geen bevestiging ontvangen. Sluit dit venster en vernieuw de deelnemerslijst voordat je opnieuw probeert.';
   message.textContent=text;message.hidden=false;
   busy=false;dialog.removeAttribute('aria-busy');cancel.disabled=false;
   confirm.textContent='Definitief verwijderen';update();message.focus();
  }
 };
}

login();
