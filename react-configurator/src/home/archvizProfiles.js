import manifest from '../../../configs/archviz-profiles.json';
import {resolveArchvizProfiles} from '../render/archvizProfiles.mjs';
// Static glob is bundled by Vite; no network requests or user-selected imports.
const files = import.meta.glob('../../../configs/archviz/rooms/*.json', {eager:true, import:'default'});
export default resolveArchvizProfiles(manifest, name => {
  const value = files[`../../../configs/${name}`];
  if (!value) throw Error(`Missing room profile: ${name}`);
  return value;
});
