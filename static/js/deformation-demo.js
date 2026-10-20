(async () => {
  const viewer = document.querySelector('.deformation-viewer');
  if (!viewer) return;
  const slider = document.getElementById('deformation-time');
  const plot = document.getElementById('deformation-plot');
  const status = document.getElementById('deformation-status');
  const video = document.getElementById('deformation-video');
  const play = document.getElementById('deformation-play');
  const replay = document.getElementById('deformation-replay');
  let videoFailed = false;
  function reportVideoError() {
    videoFailed = true;
    video.pause();
    play.disabled = replay.disabled = true;
    status.textContent = 'The wrist-camera video could not load. You can still inspect the force samples with the time slider.';
  }
  // Source-element errors do not bubble; capture them before fetching the data.
  video.addEventListener('error', reportVideoError, true);
  const ns = 'http://www.w3.org/2000/svg';
  try {
    const response = await fetch(viewer.dataset.forceSource);
    if (!response.ok) throw new Error('Force data unavailable');
    const { samples } = await response.json();
    if (!Array.isArray(samples) || samples.length < 2 || samples.some((s, i) =>
      ![s.time, s.videoTime, s.measured, s.predicted, s.current].every(Number.isFinite) || s.videoTime < 0 ||
      (i && (s.time <= samples[i - 1].time || s.videoTime <= samples[i - 1].videoTime)))) {
      throw new Error('Invalid force samples');
    }
    const duration = samples.at(-1).time;
    const yMin = Math.min(0, Math.floor(Math.min(...samples.flatMap(s => [s.measured, s.predicted, s.current])) / 2) * 2);
    const yMax = Math.ceil(Math.max(...samples.flatMap(s => [s.measured, s.predicted, s.current])) / 2) * 2;
    let selection, x, y;
    let selectedIndex = -1;
    let frameRequest = null;
    let pendingSeek = null;
    const videoFrames = typeof video.requestVideoFrameCallback === 'function';
    function node(tag, attrs, text, parent = plot) {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => n.setAttribute(key, value));
      if (text !== undefined) n.textContent = text;
      parent.append(n);
      return n;
    }
    function update(index = Number(slider.value)) {
      if (index === selectedIndex) return;
      selectedIndex = index;
      slider.value = String(index);
      const sample = samples[index];
      selection.replaceChildren();
      node('line', { x1: x(sample.time), x2: x(sample.time), y1: 32, y2: 245, stroke: 'var(--accent)', 'stroke-width': 1.5 }, undefined, selection);
      for (const key of ['current', 'measured', 'predicted']) {
        node('circle', { cx: x(sample.time), cy: y(sample[key]), r: 5, fill: `var(--${key})`, stroke: '#fff', 'stroke-width': 1.5 }, undefined, selection);
      }
      document.getElementById('deformation-time-value').textContent = `${sample.time.toFixed(2)} s`;
      slider.setAttribute('aria-valuetext', `${sample.time.toFixed(2)} seconds`);
    }
    // Video timestamps identify frames; recording timestamps retain the original
    // acquisition jitter. Do not stretch either timeline to match its duration.
    function syncToVideo(time = video.currentTime) {
      let low = 0, high = samples.length - 1;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (samples[mid].videoTime <= time + 1e-6) low = mid;
        else high = mid - 1;
      }
      update(low);
    }
    function stopSync() {
      if (frameRequest === null) return;
      if (videoFrames) video.cancelVideoFrameCallback(frameRequest);
      else cancelAnimationFrame(frameRequest);
      frameRequest = null;
    }
    function scheduleSync() {
      if (frameRequest !== null || video.paused || video.ended) return;
      frameRequest = videoFrames ? video.requestVideoFrameCallback(onFrame) : requestAnimationFrame(onFrame);
    }
    function onFrame(now, metadata) {
      frameRequest = null;
      syncToVideo(metadata ? metadata.mediaTime : video.currentTime);
      scheduleSync();
    }
    function seek(index) {
      video.pause();
      update(index);
      const time = samples[index].videoTime;
      if (videoFailed) return;
      if (video.readyState >= 1) video.currentTime = time;
      else {
        pendingSeek = time;
        video.load();
      }
    }
    async function startPlayback(restart = false) {
      if (restart || video.ended) seek(0);
      try {
        await video.play();
        status.textContent = '';
      } catch (error) {
        if (error.name !== 'AbortError') {
          status.textContent = 'Playback could not start. Try the video controls or reload the page.';
        }
      }
    }
    function render() {
      const width = Math.max(300, Math.round(plot.getBoundingClientRect().width));
      plot.setAttribute('viewBox', `0 0 ${width} 300`);
      x = t => 46 + t / duration * (width - 62);
      y = force => 245 - (force - yMin) / (yMax - yMin) * 205;
      plot.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
      node('text', { x: 46, y: 19 }, 'Force (N)');
      for (let force = yMin; force <= yMax; force += 2) {
        node('line', { x1: 46, x2: width - 16, y1: y(force), y2: y(force), stroke: 'var(--line)' });
        node('text', { x: 35, y: y(force) + 4, 'text-anchor': 'end' }, force);
      }
      for (let t = 0; t <= duration; t += width < 650 ? 4 : 2) {
        node('text', { x: x(t), y: 268, 'text-anchor': 'middle' }, t);
      }
      node('text', { x: width / 2, y: 294, 'text-anchor': 'middle' }, 'Recording time (s)');
      for (const key of ['current', 'measured', 'predicted']) {
        const d = samples.map((s, i) => `${i ? 'L' : 'M'} ${x(s.time)} ${y(s[key])}`).join(' ');
        node('path', { d, fill: 'none', stroke: `var(--${key})`, 'stroke-width': 2, class: `${key}-trace` });
      }
      selection = node('g', {});
      selectedIndex = -1;
      update();
    }
    slider.max = String(samples.length - 1);
    slider.disabled = false;
    document.getElementById('deformation-duration').textContent = `${duration.toFixed(2)} s`;
    render();
    slider.addEventListener('input', () => seek(Number(slider.value)));
    play.disabled = replay.disabled = videoFailed;
    play.addEventListener('click', () => {
      if (video.paused || video.ended) startPlayback();
      else video.pause();
    });
    replay.addEventListener('click', () => startPlayback(true));
    video.addEventListener('play', () => { play.textContent = 'Pause recording'; });
    video.addEventListener('playing', scheduleSync);
    video.addEventListener('pause', () => {
      play.textContent = 'Play recording';
      stopSync();
      syncToVideo();
    });
    video.addEventListener('ended', () => {
      play.textContent = 'Play recording';
      stopSync();
      syncToVideo();
    });
    video.addEventListener('loadedmetadata', () => {
      if (pendingSeek !== null) {
        video.currentTime = pendingSeek;
        pendingSeek = null;
      }
      syncToVideo();
    });
    for (const event of ['seeking', 'seeked']) video.addEventListener(event, () => syncToVideo());
    video.addEventListener('timeupdate', () => {
      if (!videoFrames || video.paused) syncToVideo();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) video.pause();
      }).observe(viewer);
    }
    if ('ResizeObserver' in window) new ResizeObserver(render).observe(plot.parentElement);
    else window.addEventListener('resize', render);
    syncToVideo();
    if (!video.paused) {
      play.textContent = 'Pause recording';
      scheduleSync();
    }
    status.textContent = '';
    if (videoFailed || video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) reportVideoError();
  } catch {
    status.textContent = 'The force recording could not load. Please reload the page or view Figure 4 in the paper.';
  }
})();
