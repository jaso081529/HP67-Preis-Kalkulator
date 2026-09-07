import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
test('Lokale API speichert, schützt Schreibzugriffe und übersteht Neustarts',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'hp67-test-'));
 const port=16767,url=`http://127.0.0.1:${port}`;
 let child;
 async function start(){child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),HP67_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Testserver startete nicht');}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Zeitüberschreitung')),10000);timer.unref();})]);}
 async function stop(){if(child.exitCode!==null)return;const done=once(child,'exit');child.kill();await done;}
 try{
  await start();
  assert.equal((await fetch(url)).status,200);
  for(const module of ['app.js','core.mjs','price-list-image.mjs','browser-storage.mjs']) {
   const response=await fetch(`${url}/${module}`);assert.equal(response.status,200,module);assert.match(response.headers.get('content-type'),/javascript/);
  }
  const {state,token}=await(await fetch(url+'/api/state')).json();
  state.products[0].ek=14.5;
  const save=(data,t=token)=>fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','X-HP67-Token':t,Origin:url},body:JSON.stringify(data)});
  assert.equal((await save(state,'wrong')).status,403);
  let response=await save(state);assert.equal(response.status,200);const saved=(await response.json()).state;assert.equal(saved.revision,1);
  assert.equal((await save(state)).status,409);
  const invalid=structuredClone(saved);invalid.products[0].ek=-2;assert.equal((await save(invalid)).status,400);
  assert.equal((await fetch(url+'/api/backup')).status,403);
  assert.equal((await(await fetch(url+'/api/backup',{headers:{'X-HP67-Token':token}})).json()).products[0].ek,14.5);
  const publicPrices=await(await fetch(url+'/api/public-prices')).json();
  assert.equal(publicPrices.format,'hoodplaka67-public-prices');
  assert.equal(JSON.stringify(publicPrices).includes('"ek"'),false);
  assert.equal(JSON.stringify(publicPrices).includes('customers'),false);
  assert.equal(JSON.stringify(publicPrices).includes('quotes'),false);
  assert.equal((await fetch(url+'/data/hoodplaka67.json')).status,404);
  assert.equal(JSON.parse(await readFile(path.join(dir,'hoodplaka67.json'),'utf8')).products[0].ek,14.5);
  assert.equal((await readdir(path.join(dir,'backups'))).length,1);
  await stop();await start();
  const restarted=await(await fetch(url+'/api/state')).json();assert.equal(restarted.state.products[0].ek,14.5);assert.equal(restarted.state.revision,1);
 }finally{await stop();}
});
