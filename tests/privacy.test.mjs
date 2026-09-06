import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,publicCatalog} from '../local/core.mjs';
test('Öffentlicher Export enthält nur VK-Daten',()=>{
 const state=initialState();
 Object.assign(state.settings,{owner:'Privatname',address:'Privatstraße',email:'privat@example.test',phone:'123',hourlyRate:40,taxRate:19,offerNote:'intern'});
 Object.assign(state.products[0],{visible:true,ek:4,finishing:1,minutes:10,packaging:2,other:3,markup:20,vk:17,supplier:'Privatlieferant',notes:'Geheim'});
 state.customers=[{id:'c1',name:'Privatkunde',company:'',email:'kunde@example.test',phone:'',address:'Privatadresse',notes:'Geheim'}];
 state.quotes=[];
 state.plannerItems=[{id:'plan1',title:'Privater Termin',date:'2026-09-06',time:'10:00',type:'Termin',priority:'Dringend',status:'Offen',notes:'Geheime Planung'}];
 const output=publicCatalog(state),json=JSON.stringify(output);
 assert.deepEqual(output.products[0],{id:'starter-0',name:'T-Shirt',category:'Textilien',unit:'Stück',description:'',variant:'',priceNet:17,priceGross:20.23});
 for(const secret of ['Privatname','Privatstraße','privat@example.test','Privatlieferant','Privatkunde','Geheim','Privater Termin','hourlyRate','customers','quotes','invoices','plannerItems','supplier','notes','finishing','minutes','packaging','other','markup'])assert.equal(json.includes(secret),false,secret);
});
