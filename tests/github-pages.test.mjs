import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
const builder=await readFile(new URL('../scripts/build-public-site.mjs',import.meta.url),'utf8');

test('GitHub Pages betreibt die komplette App mit lokalem Browserspeicher',()=>{
 assert.match(app,/browserStorageKey/);
 assert.match(app,/localStorage\.setItem/);
 assert.match(app,/initial-state\.json/);
 assert.match(builder,/public\/\$\{file\}/);
 assert.match(builder,/core\.mjs/);
});

test('private und öffentliche Exporte funktionieren auch ohne Server',()=>{
 assert.match(app,/action==='private-export'.*browserMode/);
 assert.match(app,/action==='public-export'.*publicCatalog/);
});
