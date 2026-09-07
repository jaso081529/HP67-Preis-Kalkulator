import {validateState} from './core.mjs';

export const browserStorageKey = 'hoodplaka67-private-state-v1';
export const browserBackupKey = `${browserStorageKey}-before-import`;

export function saveBrowserState(storage, next, {backup = false} = {}) {
  const current = storage.getItem(browserStorageKey);
  const previous = current ? validateState(JSON.parse(current)) : null;
  if (previous && previous.revision !== next.revision) {
    throw Error('Die Daten wurden in einem anderen Fenster geändert. Bitte neu laden.');
  }
  const saved = validateState(structuredClone(next));
  saved.revision++;
  const serialized = JSON.stringify(saved);
  if (new TextEncoder().encode(serialized).length > 8e6) throw Error('Die Sicherung ist zu groß (max. 8 MB).');
  // Write the backup first: a quota failure must never replace the current data.
  if (backup && current) storage.setItem(browserBackupKey, current);
  storage.setItem(browserStorageKey, serialized);
  return saved;
}
