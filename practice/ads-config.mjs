// Advertising is OFF in this release. No provider exists and live mode fails closed.
export const advertising = Object.freeze({
  mode:'off',
  provider:null,
  // Separate advertising consent boundary. Analytics acceptance MUST NOT be read here.
  consent:() => 'unknown',
  placements:Object.freeze({
    'library-between-groups':{ enabled:true, kind:'network', afterCards:6 },
    'activity-after-instructions':{ enabled:true, kind:'sponsor' },
    'players-after-introduction':{ enabled:true, kind:'network' }
  }),
  dimensions:{ mobile:{ width:300, height:250 }, desktop:{ width:728, height:120 } }
});
export function adMode({ hostname, search }, config = advertising) {
  const local = ['localhost','127.0.0.1','[::1]'].includes(hostname);
  if (local && (config.mode === 'preview' || new URLSearchParams(search).get('ads') === 'preview')) return 'preview';
  // A future live provider must implement and review this boundary first.
  // Even config.mode='live' cannot request an ad in this version.
  return 'off';
}
