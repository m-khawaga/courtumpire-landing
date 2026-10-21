export function hydrateVideos(root = document) {
  for (const v of root.querySelectorAll('video[data-video-source]')) {
    if (v.dataset.hydrated) continue;
    v.dataset.hydrated = 'true';
    function attach() { if (!v.hasAttribute('src')) v.src = v.dataset.videoSource; }
    v.addEventListener('error',() => { v.hidden = true; v.closest('.activity-video').querySelector('[data-video-status]').textContent = 'Video unavailable. Use the complete illustrated instructions below.'; });
    v.addEventListener('play',attach,{ once:true });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { if (entries.some(e=>e.isIntersecting)) { attach(); observer.disconnect(); } },{ rootMargin:'200px' }); observer.observe(v);
    } else attach();
  }
}
