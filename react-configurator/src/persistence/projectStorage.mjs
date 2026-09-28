import {decodeProject, encodeProject} from './projectCodec.mjs';

export const versionedStorageKey = legacyKey => `${legacyKey}:schema-1`;

/** Inject storage for tests. A session never silently overwrites an unreadable or newer document. */
export function createProjectStorage(getStorage, legacyKey, codecOptions) {
  const key = versionedStorageKey(legacyKey);
  let expectedRaw = null;
  let loaded = false;
  let blocked = false;
  const serialize = state => JSON.stringify(encodeProject(state, codecOptions.kitchen));

  function load() {
    // Failure deliberately latches the write guard until explicit user recovery.
    blocked = true;
    const storage = getStorage();
    expectedRaw = storage.getItem(key);
    const legacyRaw = expectedRaw === null ? storage.getItem(legacyKey) : null;
    const raw = expectedRaw ?? legacyRaw;
    const result = raw === null ? null : decodeProject(raw, codecOptions);
    loaded = true;
    blocked = false;
    return result;
  }

  function save(state) {
    if (!loaded || blocked) throw new Error('Autosave paused. The original stored project is protected; export your work or explicitly resume autosave.');
    const raw = serialize(state);
    const storage = getStorage();
    const previous = storage.getItem(key);
    if (previous !== expectedRaw) {
      blocked = true;
      throw new Error('Autosave paused: this project changed in another tab. Reload to inspect it, or export your current work.');
    }
    if (raw === previous) return;
    // Backup must succeed before replacing a valid saved project.
    if (previous !== null) storage.setItem(`${key}:previous`, previous);
    storage.setItem(key, raw);
    expectedRaw = raw;
  }

  function resume(state) {
    const raw = serialize(state);
    const storage = getStorage();
    const previous = storage.getItem(key);
    // The UI must confirm this deliberate replacement. Preserve unreadable/conflicting bytes first.
    if (previous !== null && previous !== raw) storage.setItem(`${key}:recovery`, previous);
    storage.setItem(key, raw);
    expectedRaw = raw;
    loaded = true;
    blocked = false;
  }

  function previousProject() {
    const raw = getStorage().getItem(`${key}:previous`);
    if (raw === null) throw new Error('No previous autosave is available.');
    return decodeProject(raw, codecOptions);
  }

  return {key, load, save, resume, previousProject};
}

/** Named slots use the same document schema; original unversioned slots remain untouched. */
export function saveNamedProject(storage, legacyKey, state, kitchen) {
  const key = versionedStorageKey(legacyKey);
  const raw = JSON.stringify(encodeProject(state, kitchen));
  const previous = storage.getItem(key);
  if (previous !== null && previous !== raw) storage.setItem(`${key}:previous`, previous);
  storage.setItem(key, raw);
}

export function loadNamedProject(storage, legacyKey, codecOptions) {
  const raw = storage.getItem(versionedStorageKey(legacyKey)) ?? storage.getItem(legacyKey);
  if (raw === null) throw new Error('No saved project in this slot.');
  return decodeProject(raw, codecOptions);
}
