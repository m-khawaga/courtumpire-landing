import { advertising, adMode } from './ads-config.mjs';
const previewSponsor = { name:'Sample sponsor', image:'/assets/sponsor-sample.svg', text:'Local layout sample. No partnership or endorsement.', url:'#sponsor-preview' };
// Reusable slot boundary: callers supply a DOM insertion location, never drill/planner data.
export function AdSlot(name, locationInfo = location) {
  const placement = advertising.placements[name];
  if (!placement?.enabled || adMode(locationInfo) !== 'preview' || document.body.classList.contains('courtside')) return null;
  const slot = document.createElement('aside');
  slot.className = 'ad-slot'; slot.dataset.adSlot = name;
  for (const [size, dimensions] of Object.entries(advertising.dimensions)) {
    for (const [axis, value] of Object.entries(dimensions)) slot.style.setProperty(`--ad-${size}-${axis}`,`${value}px`);
  }
  slot.setAttribute('aria-label','Advertising layout preview');
  const label = document.createElement('p'); label.className = 'ad-label'; label.textContent = 'Local preview · sample advertising'; slot.append(label);
  if (placement.kind === 'sponsor') slot.append(sponsorCard(previewSponsor));
  else { const title = document.createElement('strong'); title.textContent = 'Sample advertisement placement'; slot.append(title); const copy = document.createElement('p'); copy.textContent = 'Reserved layout · no provider, tracking or ad requests'; slot.append(copy); }
  return slot;
}
export function sponsorCard({ name, image, text, url }) {
  const card = document.createElement('div'); card.className = 'sponsor-card';
  if (url === '#sponsor-preview') card.id = 'sponsor-preview';
  const label = document.createElement('span'); label.textContent = 'Sponsored'; card.append(label);
  // Local images only. Fail closed for remote creative and unsafe destinations.
  if (image?.startsWith('/assets/') && !image.includes('..') && !image.includes('?')) { const logo = document.createElement('img'); logo.src = image; logo.alt = `${name} sample logo`; logo.width = 64; logo.height = 64; card.append(logo); }
  const link = document.createElement('a'); link.textContent = name; link.rel = 'sponsored noopener noreferrer';
  try { const destination = new URL(url, location.href); if (destination.protocol === 'https:' || (destination.origin === location.origin && destination.hash)) link.href = destination.href; } catch { /* Invalid URLs remain plain text. */ }
  card.append(link); const copy = document.createElement('p'); copy.textContent = text; card.append(copy); return card;
}
export function mountAds() {
  document.querySelectorAll('.ad-slot').forEach(node => node.remove());
  if (adMode(location) !== 'preview' || document.body.classList.contains('courtside')) return;
  let name, anchor;
  const page = document.body.dataset.page;
  if (page === 'library') {
    name = 'library-between-groups';
    const cards = document.querySelectorAll('#results > .activity-card');
    const after = advertising.placements[name].afterCards;
    // Only between nonempty groups, never a trailing empty placement.
    if (cards.length > after) anchor = cards[after-1];
  } else if (page === 'activity') { name = 'activity-after-instructions'; anchor = document.getElementById('complete-instructions'); }
  else if (page === 'players') { name = 'players-after-introduction'; anchor = document.getElementById('player-introduction'); }
  if (anchor) { const slot = AdSlot(name); if (slot) anchor.after(slot); }
}
