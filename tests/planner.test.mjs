import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,plannerSuggestions,validateState} from '../local/core.mjs';
test('Planer prüft Pflichtfelder, Datum, Uhrzeit und Auswahlwerte',()=>{
 const state=initialState();
 state.plannerItems=[{id:'p1',title:'Preisprüfung',date:'2026-09-07',time:'09:30',type:'Aufgabe',priority:'Wichtig',status:'Offen',notes:''}];
 assert.doesNotThrow(()=>validateState(state));
 for(const [key,value] of [['date','07.09.2026'],['time','25:00'],['type','Event'],['priority','Extrem'],['status','Vielleicht']]){const invalid=structuredClone(state);invalid.plannerItems[0][key]=value;assert.throws(()=>validateState(invalid));}
});
test('Vorschläge erkennen Überfälliges, fehlende Kosten und offene Angebote',()=>{
 const state=initialState();state.products[0].vk=17;
 state.plannerItems=[{id:'p1',title:'Alt',date:'2026-09-05',time:'',type:'Aufgabe',priority:'Normal',status:'Offen',notes:''}];
 state.quotes=[{id:'q1',number:'A1',date:'2026-09-01',validUntil:'',status:'Angeboten',customerName:'',customerAddress:'',note:'',customerId:'',taxRate:0,discount:0,items:[{name:'X',unit:'Stück',price:1,quantity:1}]}];
 const text=plannerSuggestions(state,'2026-09-06').map(x=>x.text).join(' ');
 assert.match(text,/überfällige/);assert.match(text,/Kostenangaben/);assert.match(text,/nachfassen/);
});
