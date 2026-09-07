import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../public/style.css',import.meta.url),'utf8');
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');

test('Bildschirm-Styles liegen außerhalb der Druckregeln',()=>{
 let depth=0;
 for(const char of css){if(char==='{')depth++;if(char==='}')depth--;assert.ok(depth>=0);}
 assert.equal(depth,0,'Alle CSS-Blöcke müssen geschlossen sein.');
 assert.match(css,/footer-note\{break-inside:avoid\}\}@page/);
});

test('iPhone-Ansicht nutzt Viewport, Safe Areas und verhindert horizontales Überlaufen',()=>{
 assert.match(html,/width=device-width/);
 assert.match(css,/env\(safe-area-inset-top\)/);
 assert.match(css,/max-width:100%;overflow-x:hidden/);
 assert.match(css,/@media\(max-width:430px\)/);
});

test('Navigation, Formulare, Tabellen und Dialoge sind mobil angepasst',()=>{
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/input,select,textarea\{font-size:16px\}/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
 assert.match(css,/height:100dvh/);
});
