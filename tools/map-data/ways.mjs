// Which OpenStreetMap ways go where. One place decides, so the highway network (map/ca-roads.json) and the street packs never overlap.
//   baseInfo(tags, opts)   -> {cls, ow, rev, label, link} for ways that belong in the statewide highway network, else null
//   streetInfo(tags)       -> {cls, ow, rev, label, link} for ways that belong in the street packs, else null
// cls: 0 motorway, 1 trunk, 2 primary, 3 secondary (highway network and packs), 4 tertiary / unclassified, 5 residential / living street (packs only)
const BASE_CLS = { motorway: 0, trunk: 1, primary: 2, secondary: 3 };
const STREET_CLS = { primary: 2, secondary: 3, tertiary: 4, unclassified: 4, residential: 5, living_street: 5 };

function oneway(t, base) {
  let ow = 0, rev = false;
  if (t.oneway === 'yes' || t.oneway === 'true' || t.oneway === '1') ow = 1;
  else if (t.oneway === '-1' || t.oneway === 'reverse') { ow = 1; rev = true; }
  else if (t.junction === 'roundabout' || t.junction === 'circular') ow = 1;
  else if (!t.oneway && base === 'motorway') ow = 1;
  return { ow, rev };
}
function blocked(t) {
  if (t.access === 'no' || t.access === 'private') return true;
  if (t.motor_vehicle === 'no' || t.motor_vehicle === 'private' || t.vehicle === 'no') return true;
  if (t.construction || t.proposed || t.abandoned || t.highway === 'construction') return true;
  if (t.area === 'yes') return true;
  return false;
}

export function baseInfo(t, opts) {
  const hw = t.highway || '', link = hw.endsWith('_link'), base = hw.replace('_link', '');
  if (!(base in BASE_CLS)) return null;
  if (blocked(t)) return null;
  const ref = String(t.ref || '').split(';')[0].trim();
  if (base === 'secondary' && (!opts.useSecondary || (opts.secondaryRefOnly && !t.ref))) return null;
  if (base === 'primary' && !ref && opts.noUnrefPrimary) return null;
  const { ow, rev } = oneway(t, base);
  let label = ref;
  if (!label && !link && t.name) label = String(t.name).trim();
  return { cls: BASE_CLS[base], ow, rev, label, link };
}

export function streetInfo(t, baseOpts) {
  const hw = t.highway || '', link = hw.endsWith('_link'), base = hw.replace('_link', '');
  if (!(base in STREET_CLS)) return null;
  if (blocked(t)) return null;
  if (baseInfo(t, baseOpts)) return null; // already in the highway network
  const { ow, rev } = oneway(t, base);
  const ref = String(t.ref || '').split(';')[0].trim();
  let label = t.name ? String(t.name).trim() : ref;
  if (link && !t.name) label = '';
  return { cls: STREET_CLS[base], ow, rev, label, link };
}
export const BASE_OPTS = { useSecondary: true, secondaryRefOnly: true, noUnrefPrimary: true };
