import test from 'node:test';
import assert from 'node:assert/strict';
import {validStudent,chosenQuestions,csv,esc} from '../shared.js';
test('studentennummers behouden voorloopnullen en eisen zeven cijfers',()=>{assert.ok(validStudent('s0230539'));for(const s of ['s123','1234567','s12345678','s123456x','<script>'])assert.equal(validStudent(s),false)});
test('elk schema dekt elke dimensie minimaal tweemaal in vijf dagen',()=>{for(let offset=0;offset<5;offset++){const counts={};for(let day=1;day<=5;day++){const q=chosenQuestions(3,day,offset);assert.equal(q.length,3);assert.equal(new Set(q.map(x=>x.id)).size,3);for(const x of q)counts[x.id]=(counts[x.id]||0)+1}assert.equal(Object.keys(counts).length,6);assert.ok(Object.values(counts).every(n=>n>=2))}});
test('volledige variant bevat zes vragen op elke dag',()=>{for(let d=1;d<=5;d++)assert.equal(chosenQuestions(6,d).length,6)});
test('CSV beschermt formules en bewaart quotes, puntkommas en regeleinden',()=>{const out=csv([{student:'s0230539',answer:'=HYPERLINK("bad")',reflection:'a;b\nc'}]);assert.ok(out.startsWith('\uFEFF'));assert.ok(out.includes("'="));assert.ok(out.includes('""bad""'));assert.ok(out.includes('"a;b\nc"'))});
test('HTML escapes externe invoer',()=>assert.equal(esc('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;'));
