// Native scrolling provides touch/trackpad support; no timer or auto-rotation.
for (const gallery of document.querySelectorAll('[data-product-gallery]')) {
  const tabs = [...gallery.querySelectorAll('[role="tab"]')];
  const panels = [...gallery.querySelectorAll('[data-gallery-panel]')];
  const states = panels.map(panel => ({ panel, track: panel.querySelector('.gallery-track'), slides: [...panel.querySelectorAll('.gallery-slide')], index: 0 }));
  const back = gallery.querySelector('[data-gallery-back]');
  const forward = gallery.querySelector('[data-gallery-forward]');
  const dots = gallery.querySelector('.gallery-dots');
  const status = gallery.querySelector('.gallery-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  let frame = 0;

  function update(state, announce = false) {
    state.slides.forEach((slide, index) => slide.classList.toggle('is-active', index === state.index));
    if (state !== states[selected]) return;
    back.disabled = state.index === 0;
    forward.disabled = state.index === state.slides.length - 1;
    [...dots.children].forEach((dot, index) => {
      if (index === state.index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (announce) status.textContent = `${tabs[selected].textContent}, ${state.index + 1} of ${state.slides.length}: ${state.slides[state.index].querySelector('strong').textContent}`;
  }

  function goTo(index, instant = false) {
    const state = states[selected];
    state.index = Math.max(0, Math.min(state.slides.length - 1, index));
    const slide = state.slides[state.index];
    const trackRect = state.track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const left = state.track.scrollLeft + slideRect.left - trackRect.left - (state.track.clientWidth - slideRect.width) / 2;
    state.track.scrollTo({ left, behavior: instant || reducedMotion.matches ? 'instant' : 'smooth' });
    update(state, true);
  }

  function select(index, focus = false) {
    selected = index;
    states.forEach((state, i) => { state.panel.hidden = i !== index; });
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    const state = states[index];
    back.setAttribute('aria-controls', state.panel.id);
    forward.setAttribute('aria-controls', state.panel.id);
    dots.replaceChildren(...state.slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show ${i + 1} of ${state.slides.length}: ${slide.querySelector('strong').textContent}`);
      dot.setAttribute('aria-controls', state.panel.id);
      dot.addEventListener('click', () => goTo(i));
      return dot;
    }));
    goTo(state.index, true);
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      select(event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true);
    });
  });
  back.addEventListener('click', () => goTo(states[selected].index - 1));
  forward.addEventListener('click', () => goTo(states[selected].index + 1));
  states.forEach(state => {
    state.track.addEventListener('keydown', event => {
      if (event.target !== state.track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      goTo(event.key === 'Home' ? 0 : event.key === 'End' ? state.slides.length - 1 : state.index + (event.key === 'ArrowRight' ? 1 : -1));
    });
    let scrollFrame = 0;
    let announcement;
    state.track.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        if (state !== states[selected]) return;
        const trackRect = state.track.getBoundingClientRect();
        const center = trackRect.left + state.track.clientWidth / 2;
        const distances = state.slides.map(slide => { const rect = slide.getBoundingClientRect(); return Math.abs(rect.left + rect.width / 2 - center); });
        state.index = distances.indexOf(Math.min(...distances));
        update(state);
        clearTimeout(announcement);
        announcement = setTimeout(() => update(state, true), 150);
      });
    }, { passive: true });
  });
  // Keep the selected screenshot centered after resize or device rotation.
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => goTo(states[selected].index, true));
  });
  select(0);
  gallery.classList.add('is-ready');
  gallery.querySelector('.gallery-tabs').hidden = false;
  gallery.querySelector('.gallery-navigation').hidden = false;
  resize.observe(gallery);
}
