import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {decodeProject, encodeProject} from '../persistence/projectCodec.mjs';
import {createProjectStorage} from '../persistence/projectStorage.mjs';

/** One state replacement per successful import. View/selection state stays in the component. */
export function useKitchenProject(defaults, kitchen, legacyKey) {
  const [project, setProject] = useState(() => structuredClone(defaults));
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState({state: 'loading', message: 'Reading autosave…'});
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const initDone = useRef(false);
  const storage = useMemo(() => createProjectStorage(() => window.localStorage, legacyKey, {kitchen, defaults}), [defaults, kitchen, legacyKey]);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    try {
      const loaded = storage.load();
      if (loaded) {
        setProject(loaded.state);
        setNotice(loaded.warnings.join('\n'));
      }
    } catch (error) {
      setNotice(`Autosave could not be loaded: ${error.message} The stored data was not overwritten.`);
      setStatus({state: 'error', message: 'Autosave paused; stored data is protected.'});
    }
    setHydrated(true);
  }, [storage]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      storage.save(project);
      setStatus({state: 'saved', message: 'Saved in this browser.'});
    } catch (error) {
      setStatus({state: 'error', message: `Not saved: ${error.message}`});
    }
  }, [project, hydrated, storage]);

  const setters = useMemo(() => Object.fromEntries(Object.keys(defaults).map(key => [
    `set${key[0].toUpperCase()}${key.slice(1)}`,
    update => {
      generation.current += 1;
      setStatus({state: 'unsaved', message: 'Saving…'});
      setProject(previous => ({...previous, [key]: typeof update === 'function' ? update(previous[key]) : update}));
    },
  ])), [defaults]);

  const replace = useCallback((next, expectedGeneration) => {
    if (expectedGeneration !== undefined && generation.current !== expectedGeneration) {
      throw new Error('The project changed while the file was being read. Load it again to replace the newer state.');
    }
    generation.current += 1;
    setProject(next);
    setStatus({state: 'unsaved', message: 'Saving…'});
  }, []);

  const loadProject = useCallback((input, expectedGeneration) => {
    const result = decodeProject(input, {kitchen, defaults});
    replace(result.state, expectedGeneration);
    return result;
  }, [defaults, kitchen, replace]);

  const resetProject = useCallback(() => {
    replace(structuredClone(defaults));
    setNotice('');
  }, [defaults, replace]);

  const resumeAutosave = useCallback(() => {
    try {
      storage.resume(project);
      setStatus({state: 'saved', message: 'Saved. Prior stored data was retained for recovery.'});
      setNotice('');
    } catch (error) {
      setStatus({state: 'error', message: `Not saved: ${error.message}`});
    }
  }, [project, storage]);

  const restorePrevious = useCallback(() => {
    const result = storage.previousProject();
    replace(result.state);
    setNotice('Restored previous autosave into the workspace. ' + result.warnings.join('\n'));
  }, [replace, storage]);

  return {
    project, setters, loadProject, resetProject, restorePrevious, resumeAutosave,
    status, notice, hydrated, storageKey: storage.key,
    getGeneration: () => generation.current,
    getDocument: () => encodeProject(project, kitchen),
  };
}
