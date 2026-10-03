(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const comparisons = [...document.querySelectorAll('[data-comparison]')].map(panel => {
    const videos = [...panel.querySelectorAll('video')];
    const status = panel.querySelector('.playback-status');
    let requestId = 0;
    let autoStarted = false;
    function pause() {
      requestId += 1;
      videos.forEach(video => video.pause());
    }
    async function play(restart = false, automatic = false) {
      const id = ++requestId;
      if (restart) videos.forEach(video => { video.currentTime = 0; });
      const outcomes = await Promise.allSettled(videos.map(video => video.play()));
      if (id !== requestId) return;
      if (outcomes.some(outcome => outcome.status === 'rejected')) {
        pause();
        status.textContent = automatic ? '' : 'Playback could not start. Use the individual players or download the videos.';
      } else {
        status.textContent = automatic ? '' : 'Both videos are playing.';
      }
    }
    panel.querySelector('[data-play]').addEventListener('click', () => { autoStarted = true; play(); });
    panel.querySelector('[data-pause]').addEventListener('click', () => { autoStarted = true; pause(); status.textContent = 'Videos paused.'; });
    panel.querySelector('[data-replay]').addEventListener('click', () => { autoStarted = true; play(true); });
    videos.forEach(video => video.addEventListener('error', () => { status.textContent = 'A video could not load. Use its download link below.'; }));
    return { panel, pause, enter() {
      if (autoStarted || reducedMotion.matches || document.hidden) return;
      autoStarted = true;
      play(false, true);
    } };
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const comparison = comparisons.find(item => item.panel === entry.target);
        if (entry.isIntersecting) comparison.enter();
        else comparison.pause();
      });
    }, { threshold: 0.25 });
    comparisons.forEach(({ panel }) => observer.observe(panel));
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) comparisons.forEach(item => item.pause());
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) comparisons.forEach(item => item.pause());
  });
  const copy = document.querySelector('.copy-button');
  copy.addEventListener('click', async () => {
    const target = document.querySelector(copy.dataset.copyTarget);
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      copy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      copy.textContent = 'Selected — copy with your keyboard';
    }
    window.setTimeout(() => { copy.textContent = 'Copy BibTeX'; }, 2000);
  });
})();
