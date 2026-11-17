-- LOSSE beheerqueries; niet als compleet script uitvoeren.
-- Gebruik alleen in Supabase SQL Editor. Vervang het fictieve nummer.

-- 1. Deelnamecode herstellen: levert eenmalig de nieuwe code terug.
-- Bestaande sessies worden tegelijk ingetrokken.
with new_code as (select replace(gen_random_uuid()::text,'-','') as code),
changed as (
 update comez_private.participants set code_hash=md5(new_code.code)
 from new_code where student_number='s0000000'
 returning id
), revoked as (
 delete from comez_private.sessions where participant_id in(select id from changed)
)
select code from new_code where exists(select 1 from changed);

-- 2. Verwijder op verzoek één deelnemer en alle gekoppelde antwoorden/sessies.
-- Onomkeerbaar zonder back-up: controleer nummer vooraf.
-- delete from comez_private.participants where student_number='s0000000';
