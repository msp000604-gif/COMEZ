-- COMEZ: uitvoeren in een NIEUW Supabase-project via SQL Editor als postgres.
-- Studentennummers/codes/antwoorden nooit in GitHub opslaan.
begin;
create schema if not exists comez_private;
revoke all on schema comez_private from public, anon, authenticated;
create table comez_private.admins (user_id uuid primary key references auth.users(id));
create table comez_private.participants (
 id uuid primary key default gen_random_uuid(), student_number text unique not null check(student_number ~ '^s[0-9]{7}$'),
 code_hash text not null, question_count int not null check(question_count in(3,6)), start_date date not null,
 rotation_offset int not null default 0 check(rotation_offset between 0 and 4), created_at timestamptz default now()
);
create table comez_private.sessions(token uuid primary key default gen_random_uuid(),participant_id uuid not null references comez_private.participants(id) on delete cascade, expires_at timestamptz not null default now()+interval '12 hours');
create table comez_private.questions(id text primary key,dimension text not null,question_text text not null,kind text not null);
insert into comez_private.questions values
 ('temporal','Temporeel','Had je voldoende tijd om rustig te eten?','quality'),
 ('cognitive','Cognitief','Heb je tijdens het eten naar een scherm gekeken?','quality'),
 ('physiological','Fysiologisch','Voelde je je aangenaam verzadigd na deze maaltijd?','quality'),
 ('social','Sociaal','Heb je deze maaltijd samen met iemand gegeten?','quality'),
 ('environmental','Omgeving','Vond je de plek waar je at aangenaam?','quality'),
 ('affective','Affectief','Heb je van dit eetmoment genoten?','quality'),
 ('meal','Maaltijd','Wat heb je gegeten?','text'),
 ('meal_format','Maaltijd','Hoe kwam je maaltijd tot stand?','format'),
 ('reflection','Reflectie','Wat had dit eetmoment aangenamer gemaakt?','text'),
 ('burden','Evaluatie','Hoeveel moeite kostte het invullen?','burden'),
 ('preference','Evaluatie','Wat zou je aan de vragen of deelname veranderen?','text');
create table comez_private.days (
 id uuid primary key default gen_random_uuid(), participant_id uuid not null references comez_private.participants(id) on delete cascade,
 study_day int not null check(study_day between 1 and 5), question_count int not null,
 questions jsonb not null, started_at timestamptz not null default now(), completed_at timestamptz,
 unique(participant_id,study_day)
);
create table comez_private.answers (
 day_id uuid references comez_private.days(id) on delete cascade,
 question_id text references comez_private.questions(id), question_text text not null, dimension text not null,
 answer text not null, first_answered_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(day_id,question_id)
);
-- Defense in depth: no direct table access; only the explicitly granted RPCs below.
alter table comez_private.admins enable row level security;
alter table comez_private.participants enable row level security;
alter table comez_private.sessions enable row level security;
alter table comez_private.questions enable row level security;
alter table comez_private.days enable row level security;
alter table comez_private.answers enable row level security;
revoke all on all tables in schema comez_private from public,anon,authenticated;

create function comez_private.resolve(p_token uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid;
begin
 select participant_id into pid from comez_private.sessions where token=p_token and expires_at>now();
 if pid is null then raise exception 'Sessie verlopen. Meld je opnieuw aan.'; end if;
 return pid;
end $$;
create function public.comez_login(p_student text,p_code text) returns uuid language plpgsql security definer set search_path='' as $$
declare pid uuid; t uuid;
begin
 select id into pid from comez_private.participants where student_number=lower(trim(p_student)) and code_hash=md5(trim(p_code));
 if pid is null then raise exception 'Studentennummer of deelnamecode klopt niet.'; end if;
 delete from comez_private.sessions where expires_at<now();
 insert into comez_private.sessions(participant_id) values(pid) returning token into t;
 return t;
end $$;
create function public.comez_day(p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p comez_private.participants; d comez_private.days; n int; ids text[]; qs jsonb; a jsonb;
begin
 select * into p from comez_private.participants where id=comez_private.resolve(p_token) for update;
 n:=(now() at time zone 'Europe/Brussels')::date-p.start_date+1;
 if n<1 then return jsonb_build_object('status','upcoming','start_date',p.start_date); end if;
 if n>5 then return jsonb_build_object('status','closed'); end if;
 select * into d from comez_private.days where participant_id=p.id and study_day=n;
 if d.id is null then
  if p.question_count=6 then ids:=array['temporal','cognitive','physiological','social','environmental','affective'];
  else
   case mod(n-1+p.rotation_offset,5)
    when 0 then ids:=array['temporal','cognitive','social'];
    when 1 then ids:=array['physiological','environmental','affective'];
    when 2 then ids:=array['temporal','environmental','affective'];
    when 3 then ids:=array['cognitive','physiological','social'];
    when 4 then ids:=array['temporal','physiological','environmental'];
   end case;
  end if;
  select jsonb_agg(jsonb_build_object('id',id,'text',question_text,'dimension',dimension) order by array_position(ids,id)) into qs from comez_private.questions where id=any(ids);
  insert into comez_private.days(participant_id,study_day,question_count,questions) values(p.id,n,p.question_count,qs) returning * into d;
 end if;
 select coalesce(jsonb_object_agg(question_id,answer),'{}'::jsonb) into a from comez_private.answers where day_id=d.id;
 return jsonb_build_object('status',case when d.completed_at is null then 'open' else 'done' end,'day',n,'count',d.question_count,'questions',d.questions,'answers',a);
end $$;
create function public.comez_save(p_token uuid,p_day int,p_answers jsonb,p_finish boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare p comez_private.participants; d comez_private.days; k text; v text; q comez_private.questions; snap jsonb; allowed text[]; skipped boolean; required_ids text[];
begin
 select * into p from comez_private.participants where id=comez_private.resolve(p_token);
 if p_day is distinct from ((now() at time zone 'Europe/Brussels')::date-p.start_date+1) then raise exception 'Deze studiedag is niet meer open. Meld je opnieuw aan.'; end if;
 select * into d from comez_private.days where participant_id=p.id and study_day=p_day for update;
 if d.id is null or d.completed_at is not null then raise exception 'Deze registratie is niet open.'; end if;
 if jsonb_typeof(p_answers)<>'object' or p_answers is null then raise exception 'Ongeldige antwoorden.'; end if;
 select array_agg(x->>'id') into allowed from jsonb_array_elements(d.questions) x;
 allowed:=allowed||array['meal','meal_format','reflection'];
 if p_day=5 then allowed:=allowed||array['burden','preference']; end if;
 for k,v in select key,value from jsonb_each_text(p_answers) loop
  if not(k=any(allowed)) or v is null or jsonb_typeof(p_answers->k)<>'string' or length(v)>2000 then raise exception 'Ongeldige vraag of antwoord.'; end if;
  select * into q from comez_private.questions where id=k;
  if q.kind='quality' and v not in('Ja','Nee','Niet van toepassing') then raise exception 'Kies een geldig antwoord.'; end if;
  if q.kind='format' and v not in('Zelf gekookt','Kookpakket','Kant-en-klaar opgewarmd','Afgehaald / bezorgd','Restaurant','Restjes','Anders','Geen avondmaaltijd') then raise exception 'Kies een maaltijdvorm.'; end if;
  if q.kind='burden' and v not in('1 · Heel weinig','2 · Weinig','3 · Gemiddeld','4 · Veel','5 · Heel veel') then raise exception 'Kies een belastingniveau.'; end if;
  if k='meal' and (length(trim(v))=0 or length(v)>500) then raise exception 'Beschrijf je maaltijd (max. 500 tekens).'; end if;
  select x into snap from jsonb_array_elements(d.questions) x where x->>'id'=k;
  insert into comez_private.answers(day_id,question_id,question_text,dimension,answer)
   values(d.id,k,coalesce(snap->>'text',q.question_text),coalesce(snap->>'dimension',q.dimension),v)
   on conflict(day_id,question_id) do update set answer=excluded.answer,updated_at=now();
 end loop;
 select exists(select 1 from comez_private.answers where day_id=d.id and question_id='meal_format' and answer='Geen avondmaaltijd') into skipped;
 if skipped then delete from comez_private.answers where day_id=d.id and question_id in(select x->>'id' from jsonb_array_elements(d.questions) x); end if;
 if p_finish then
  required_ids:=array['meal','meal_format'];
  if not skipped then select required_ids||array_agg(x->>'id') into required_ids from jsonb_array_elements(d.questions) x; end if;
  if p_day=5 then required_ids:=required_ids||array['burden']; end if;
  if exists(select 1 from unnest(required_ids) r where not exists(select 1 from comez_private.answers a where a.day_id=d.id and a.question_id=r and length(trim(a.answer))>0)) then raise exception 'Beantwoord eerst alle verplichte vragen.'; end if;
  update comez_private.days set completed_at=now() where id=d.id;
 end if;
 return true;
end $$;
create function public.comez_admin(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; rec comez_private.participants; s text; c text;
begin
 if not exists(select 1 from comez_private.admins where user_id=auth.uid()) then raise exception 'Geen beheerderstoegang.'; end if;
 if p_action='list' then
  select coalesce(jsonb_agg(to_jsonb(t) order by student_number),'[]'::jsonb) into result from
   (select p.student_number,p.question_count,p.start_date,p.rotation_offset,(select count(*) from comez_private.days d where d.participant_id=p.id and d.completed_at is not null) completed from comez_private.participants p) t;
 elsif p_action='upsert' then
  s:=lower(trim(p_payload->>'student'));
  if s is null or s!~'^s[0-9]{7}$' then raise exception 'Ongeldig studentennummer.'; end if;
  select * into rec from comez_private.participants where student_number=s for update;
  if rec.id is not null then
   if exists(select 1 from comez_private.days where participant_id=rec.id) then raise exception 'De student is al gestart. Toewijzing en startdatum staan vast.'; end if;
   update comez_private.participants set question_count=(p_payload->>'count')::int,start_date=(p_payload->>'start')::date,rotation_offset=(p_payload->>'offset')::int where id=rec.id;
   result:=jsonb_build_object('updated',true);
  else
   c:=replace(gen_random_uuid()::text,'-','');
   insert into comez_private.participants(student_number,code_hash,question_count,start_date,rotation_offset) values(s,md5(c),(p_payload->>'count')::int,(p_payload->>'start')::date,(p_payload->>'offset')::int);
   result:=jsonb_build_object('code',c);
  end if;
 elsif p_action='export' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from (
   select p.student_number,case when d.question_count=3 then 'A' else 'B' end as study_group,d.question_count,p.rotation_offset,d.study_day,p.start_date+d.study_day-1 as meal_date,a.question_id,a.dimension,a.question_text,a.answer,a.first_answered_at,a.updated_at,d.started_at,d.completed_at,(d.completed_at is not null) as day_complete
   from comez_private.answers a join comez_private.days d on d.id=a.day_id join comez_private.participants p on p.id=d.participant_id
   order by p.student_number,d.study_day,a.question_id) t;
 elsif p_action='days' then
  select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from (
   select p.student_number,case when p.question_count=3 then 'A' else 'B' end study_group,n.study_day,p.start_date+n.study_day-1 meal_date,
   case when d.completed_at is not null then 'completed' when d.id is not null then 'started' when p.start_date+n.study_day-1>(now() at time zone 'Europe/Brussels')::date then 'future' else 'not_started' end status,
   d.started_at,d.completed_at,extract(epoch from(d.completed_at-d.started_at)) as elapsed_seconds,
   d.questions as assigned_questions,(select count(*) from comez_private.answers a where a.day_id=d.id) as answered_count
   from comez_private.participants p cross join generate_series(1,5) n(study_day) left join comez_private.days d on d.participant_id=p.id and d.study_day=n.study_day order by p.student_number,n.study_day) t;
 else raise exception 'Onbekende beheeractie.';
 end if;
 return result;
end $$;
revoke all on all functions in schema comez_private from public,anon,authenticated;
revoke all on function public.comez_login(text,text),public.comez_day(uuid),public.comez_save(uuid,int,jsonb,boolean),public.comez_admin(text,jsonb) from public,anon,authenticated;
grant execute on function public.comez_login(text,text),public.comez_day(uuid),public.comez_save(uuid,int,jsonb,boolean) to anon,authenticated;
grant execute on function public.comez_admin(text,jsonb) to authenticated;
commit;
