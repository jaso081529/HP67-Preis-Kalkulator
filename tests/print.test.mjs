import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');

test('alle Druckaktionen öffnen die gemeinsame sichtbare Druckansicht', () => {
  assert.match(app, /function openPrintView\(/);
  assert.match(app, /action==='print'.*openPrintView/);
  assert.match(app, /action==='print-invoice'.*openPrintView/);
  assert.match(app, /Jetzt drucken \/ als PDF speichern/);
  assert.doesNotMatch(app, /action==='print'.*window\.print\(\)/);
});

test('die Druckansicht funktioniert ohne Pop-up und bietet eine Datei als Fallback', () => {
  assert.doesNotMatch(app, /window\.open\(/);
  assert.match(app, /dialog\.showModal\(\)/);
  assert.match(app, /function downloadPrintFile\(/);
  assert.match(app, /action==='download-print'/);
});
