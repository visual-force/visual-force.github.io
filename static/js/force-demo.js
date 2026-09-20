(async () => {
  const target = document.querySelector('#target');
  const plot = document.querySelector('#force-plot');
  if (!target || !plot) return;
  const decision = document.querySelector('#force-decision');
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attrs, text) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    plot.append(node);
    return node;
  }
  try {
    const response = await fetch('static/data/force-candidates.json');
    if (!response.ok) throw new Error('Candidate data unavailable');
    const data = await response.json();
    const candidates = data.candidates;
    if (!Array.isArray(candidates) || candidates.length !== 32 ||
        candidates.some(c => !Number.isInteger(c.id) || !Number.isFinite(c.force) || !Number.isFinite(c.jitter)) ||
        new Set(candidates.map(c => c.id)).size !== 32 || !Number.isFinite(data.target) ||
        !candidates.some(c => c.id === data.baseline)) throw new Error('Invalid candidates');
    let baseline = candidates.findIndex(c => c.id === data.baseline);
    const min = Number(target.min), max = Number(target.max);
    const mobile = window.matchMedia('(max-width: 650px)');
    const label = i => `Candidate ${String(candidates[i].id + 1).padStart(2, '0')}`;
    function render() {
      const width = mobile.matches ? 400 : 900;
      const x = force => 36 + (force - min) * (width - 72) / (max - min);
      plot.setAttribute('viewBox', `0 0 ${width} 310`);
      const goal = Number(target.value);
      const selected = candidates.reduce((best, c, i) => Math.abs(c.force - goal) < Math.abs(candidates[best].force - goal) ? i : best, 0);
      const force = candidates[selected].force;
      const error = Math.abs(force - goal);
      document.querySelector('#target-value').textContent = `${goal.toFixed(2)} N`;
      target.setAttribute('aria-valuetext', `${goal.toFixed(2)} newtons`);
      plot.querySelectorAll(':scope > :not(title):not(desc)').forEach(node => node.remove());
      for (let tick = 3; tick <= 7; tick++) {
        element('line', { x1:x(tick), x2:x(tick), y1:40, y2:205, stroke:'var(--line)' });
        element('text', { x:x(tick), y:228, 'text-anchor':'middle' }, tick);
      }
      element('text', { x:width / 2, y:251, 'text-anchor':'middle' }, 'Predicted force (N)');
      element('line', { x1:x(goal), x2:x(goal), y1:32, y2:205, stroke:'var(--accent)', 'stroke-dasharray':'5 5', 'stroke-width':2 });
      element('text', { x:Math.max(80, Math.min(width - 80, x(goal))), y:22, 'text-anchor':'middle', class:'force-target-label' }, `Target ${goal.toFixed(2)} N`);
      // Preserve the paper's randomized vertical offsets; only x encodes force.
      // Resolve collisions vertically so all 32 candidates remain visible.
      const jitterMin = Math.min(...candidates.map(c => c.jitter));
      const jitterMax = Math.max(...candidates.map(c => c.jitter));
      const positions = [];
      candidates.forEach(c => {
        const preferred = 50 + (c.jitter - jitterMin) / (jitterMax - jitterMin || 1) * 140;
        const options = Array.from({ length:76 }, (_, i) => 45 + i * 2).sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred));
        const chosenY = options.find(value => positions.every(p => Math.hypot(x(c.force) - p.x, value - p.y) >= 16)) ?? preferred;
        positions.push({ x:x(c.force), y:chosenY });
      });
      const y = i => positions[i].y;
      const drawCandidate = i => {
        const c = candidates[i];
        if (i === baseline) element('circle', { cx:x(c.force), cy:y(i), r:12, fill:'none', stroke:'var(--baseline)', 'stroke-width':2 });
        const dot = element('circle', { cx:x(c.force), cy:y(i), r:i === selected ? 9 : 6, fill:i === selected ? 'var(--green)' : 'var(--policy)', stroke:'#fff', 'stroke-width':2, 'data-candidate-id':c.id });
        const title = document.createElementNS(ns, 'title');
        title.textContent = `${label(i)}: ${c.force.toFixed(2)} N${i === selected ? ', execute this action' : ''}`;
        dot.append(title);
      };
      candidates.forEach((_, i) => { if (i !== selected) drawCandidate(i); });
      drawCandidate(selected);
      element('line', { x1:x(force), x2:x(force), y1:y(selected) + 12, y2:205, stroke:'var(--green)', 'stroke-width':2 });
      element('line', { x1:x(goal), x2:x(force), y1:276, y2:276, stroke:'var(--green)', 'stroke-width':3 });
      for (const f of [goal, force]) element('line', { x1:x(f), x2:x(f), y1:270, y2:282, stroke:'var(--green)', 'stroke-width':2 });
      element('text', { x:Math.max(100, Math.min(width - 100, (x(goal) + x(force)) / 2)), y:302, 'text-anchor':'middle' }, `${error.toFixed(2)} N from target`);
      decision.textContent = `Execute ${label(selected).toLowerCase()}: ${force.toFixed(2)} N is closest to the ${goal.toFixed(2)} N target.`;
      const low = Math.min(...candidates.map(c => c.force)), high = Math.max(...candidates.map(c => c.force));
      document.querySelector('#force-context').textContent = goal < low
        ? 'Every candidate predicts more force than requested. Search chooses the closest available option; it cannot guarantee the target force.'
        : goal > high
          ? 'Every candidate predicts less force than requested. Search chooses the closest available option; it cannot guarantee the target force.'
          : 'The chosen action can change as the target moves. Search chooses the closest prediction, which need not be the lowest force.';
      for (const [prefix, i] of [['baseline', baseline], ['selected', selected]]) {
        document.querySelector(`#${prefix}-action`).textContent = `${candidates[i].force.toFixed(2)} N predicted`;
        document.querySelector(`#${prefix}-force`).textContent = `${label(i)} · ${Math.abs(candidates[i].force - goal).toFixed(2)} N from target`;
      }
      document.querySelector('#reset').setAttribute('aria-pressed', goal === data.target);
      document.querySelectorAll('[data-force-target]').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.forceTarget) === goal));
    }
    target.value = String(data.target);
    target.disabled = false;
    target.addEventListener('input', render);
    mobile.addEventListener('change', render);
    for (const id of ['draw', 'reset']) document.getElementById(id).disabled = false;
    document.querySelector('#draw').addEventListener('click', () => { baseline = Math.floor(Math.random() * candidates.length); render(); });
    document.querySelector('#reset').addEventListener('click', () => { baseline = candidates.findIndex(c => c.id === data.baseline); target.value = String(data.target); render(); });
    document.querySelectorAll('[data-force-target]').forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => { target.value = button.dataset.forceTarget; render(); });
    });
    render();
  } catch {
    decision.textContent = 'The recorded candidates could not load. Reload the page or view Figure 8 in the paper.';
  }
})();
