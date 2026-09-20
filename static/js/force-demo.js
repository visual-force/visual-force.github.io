(() => {
  // Synthetic examples solely for explaining Algorithm 1; not measured model outputs.
  const forces = Array.from({ length: 32 }, (_, i) => Number((0.8 + ((i * 17) % 32) * 0.26).toFixed(2)));
  const target = document.querySelector('#target');
  const plot = document.querySelector('#force-plot');
  let baseline = 9;
  const ns = 'http://www.w3.org/2000/svg';
  function element(tag, attrs, text) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    plot.append(node);
    return node;
  }
  function render() {
    const width = window.matchMedia('(max-width: 650px)').matches ? 400 : 900;
    const x = force => 40 + force * (width - 80) / 10;
    plot.setAttribute('viewBox', `0 0 ${width} 260`);
    const goal = Number(target.value);
    const selected = forces.reduce((best, force, i) => Math.abs(force - goal) < Math.abs(forces[best] - goal) ? i : best, 0);
    document.querySelector('#target-value').textContent = `${goal.toFixed(2)} N`;
    target.setAttribute('aria-valuetext', `${goal.toFixed(2)} newtons`);
    plot.querySelectorAll(':scope > :not(title):not(desc)').forEach(node => node.remove());
    for (let i = 0; i <= 10; i += 2) {
      element('line', { x1: x(i), x2: x(i), y1: 40, y2: 200, stroke: 'var(--line)' });
      element('text', { x: x(i), y: 223, 'text-anchor': 'middle' }, `${i}`);
    }
    element('text', { x: width / 2, y: 251, 'text-anchor': 'middle' }, 'Predicted force (N)');
    element('line', { x1: x(goal), x2: x(goal), y1: 32, y2: 200, stroke: 'var(--green)', 'stroke-dasharray': '5 5', 'stroke-width': 2 });
    element('text', { x: Math.max(70, Math.min(width - 80, x(goal))), y: 22, 'text-anchor': 'middle' }, `Target ${goal.toFixed(2)} N`);
    forces.forEach((force, i) => {
      const y = 65 + ((i * 7) % 5) * 26;
      if (i === baseline) element('circle', { cx: x(force), cy: y, r: 13, fill: 'none', stroke: 'var(--baseline)', 'stroke-width': 3 });
      const dot = element('circle', { cx: x(force), cy: y, r: i === selected ? 9 : 6, fill: i === selected ? 'var(--green)' : 'var(--policy)', stroke: '#fff', 'stroke-width': 2 });
      const title = document.createElementNS(ns, 'title');
      title.textContent = `Action ${i + 1}: ${force.toFixed(2)} N${i === selected ? ', selected' : ''}`;
      dot.append(title);
    });
    for (const [prefix, index] of [['baseline', baseline], ['selected', selected]]) {
      document.querySelector(`#${prefix}-action`).textContent = `Action ${String(index + 1).padStart(2, '0')}`;
      document.querySelector(`#${prefix}-force`).textContent = `${forces[index].toFixed(2)} N predicted · ${Math.abs(forces[index] - goal).toFixed(2)} N from target`;
    }
  }
  target.addEventListener('input', render);
  window.matchMedia('(max-width: 650px)').addEventListener('change', render);
  document.querySelector('#draw').addEventListener('click', () => { baseline = Math.floor(Math.random() * forces.length); render(); });
  document.querySelector('#reset').addEventListener('click', () => { baseline = 9; target.value = '4.5'; render(); });
  render();
})();
