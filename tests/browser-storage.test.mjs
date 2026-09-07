import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../local/core.mjs';
import {browserStorageKey, browserBackupKey, saveBrowserState} from '../local/browser-storage.mjs';

function storage(initial = initialState()) {
  const data = new Map([[browserStorageKey, JSON.stringify(initial)]]);
  return {getItem:key=>data.get(key)??null, setItem:(key,value)=>data.set(key,value)};
}
test('Veraltete Browserfenster überschreiben keine neueren Daten',()=>{
  const db=storage(), next=initialState();next.settings.business='Neu';
  assert.equal(saveBrowserState(db,next).revision,1);
  assert.throws(()=>saveBrowserState(db,initialState()),/anderen Fenster/);
  assert.equal(JSON.parse(db.getItem(browserStorageKey)).settings.business,'Neu');
  assert.equal(next.revision,0);
});
test('Import sichert den exakten vorherigen Browserstand',()=>{
  const db=storage(),previous=db.getItem(browserStorageKey),next=initialState();next.settings.business='Import';
  saveBrowserState(db,next,{backup:true});
  assert.equal(db.getItem(browserBackupKey),previous);
  assert.equal(JSON.parse(db.getItem(browserStorageKey)).settings.business,'Import');
});
test('Fehlgeschlagene Sicherung ersetzt keine Daten',()=>{
  const db=storage(),previous=db.getItem(browserStorageKey),setItem=db.setItem;
  db.setItem=(key,value)=>{if(key===browserBackupKey)throw Error('QuotaExceededError');setItem(key,value);};
  assert.throws(()=>saveBrowserState(db,initialState(),{backup:true}),/Quota/);
  assert.equal(db.getItem(browserStorageKey),previous);
});
