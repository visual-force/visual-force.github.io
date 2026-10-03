(async () => {
  const viewer = document.querySelector('.deformation-viewer');
  if (!viewer) return;
  const slider = document.getElementById('deformation-time');
  const plot = document.getElementById('deformation-plot');
  const status = document.getElementById('deformation-status');
  const ns = 'http://www.w3.org/2000/svg';
  try {
    const response = await fetch(viewer.dataset.forceSource);
    if (!response.ok) throw new Error('Force data unavailable');
    const { samples } = await response.json();
    if (!Array.isArray(samples) || samples.length < 2 || samples.some((s, i) =>
      ![s.time, s.measured, s.predicted, s.current].every(Number.isFinite) || (i && s.time <= samples[i - 1].time))) {
      throw new Error('Invalid force samples');
    }
    const duration = samples.at(-1).time;
    const yMin = Math.min(0, Math.floor(Math.min(...samples.flatMap(s => [s.measured, s.predicted, s.current])) / 2) * 2);
    const yMax = Math.ceil(Math.max(...samples.flatMap(s => [s.measured, s.predicted, s.current])) / 2) * 2;
    const mobile = window.matchMedia('(max-width: 650px)');
    let selection, x, y;
    function node(tag, attrs, text, parent = plot) {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => n.setAttribute(key, value));
      if (text !== undefined) n.textContent = text;
      parent.append(n);
      return n;
    }
    function update() {
      const sample = samples[Number(slider.value)];
      selection.replaceChildren();
      node('line', { x1: x(sample.time), x2: x(sample.time), y1: 32, y2: 245, stroke: 'var(--accent)', 'stroke-width': 1.5 }, undefined, selection);
      for (const key of ['current', 'measured', 'predicted']) {
        node('circle', { cx: x(sample.time), cy: y(sample[key]), r: 5, fill: `var(--${key})`, stroke: '#fff', 'stroke-width': 1.5 }, undefined, selection);
      }
      document.getElementById('deformation-time-value').textContent = `${sample.time.toFixed(2)} s`;
      slider.setAttribute('aria-valuetext', `${sample.time.toFixed(2)} seconds`);
      document.getElementById('deformation-measured').textContent = `${sample.measured.toFixed(2)} N`;
      document.getElementById('deformation-current').textContent = `${sample.current.toFixed(2)} N`;
      document.getElementById('deformation-predicted').textContent = `${sample.predicted.toFixed(2)} N`;
    }
    function render() {
      const width = mobile.matches ? 400 : 900;
      plot.setAttribute('viewBox', `0 0 ${width} 300`);
      x = t => 46 + t / duration * (width - 62);
      y = force => 245 - (force - yMin) / (yMax - yMin) * 205;
      plot.querySelectorAll(':scope > :not(title):not(desc)').forEach(n => n.remove());
      node('text', { x: 46, y: 19 }, 'Force (N)');
      for (let force = yMin; force <= yMax; force += 2) {
        node('line', { x1: 46, x2: width - 16, y1: y(force), y2: y(force), stroke: 'var(--line)' });
        node('text', { x: 35, y: y(force) + 4, 'text-anchor': 'end' }, force);
      }
      for (let t = 0; t <= duration; t += mobile.matches ? 4 : 2) {
        node('text', { x: x(t), y: 268, 'text-anchor': 'middle' }, t);
      }
      node('text', { x: width / 2, y: 294, 'text-anchor': 'middle' }, 'Recording time (s)');
      for (const key of ['current', 'measured', 'predicted']) {
        const d = samples.map((s, i) => `${i ? 'L' : 'M'} ${x(s.time)} ${y(s[key])}`).join(' ');
        node('path', { d, fill: 'none', stroke: `var(--${key})`, 'stroke-width': 2, class: `${key}-trace` });
      }
      selection = node('g', {});
      update();
    }
    slider.max = String(samples.length - 1);
    slider.disabled = false;
    document.getElementById('deformation-duration').textContent = `${duration.toFixed(2)} s`;
    slider.addEventListener('input', update);
    mobile.addEventListener('change', render);
    render();
    status.textContent = '';
  } catch {
    status.textContent = 'The force recording could not load. Please reload the page or view Figure 4 in the paper.';
  }
})();
