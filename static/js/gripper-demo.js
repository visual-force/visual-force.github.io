(() => {
  const demo = document.querySelector('.gripper-demo');
  if (!demo) return;
  const scene = demo.querySelector('[data-gripper-scene]');
  const slider = demo.querySelector('#gripper-force');
  const ns = 'http://www.w3.org/2000/svg';
  function node(parent, tag, attrs, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== undefined) el.textContent = text;
    parent.append(el);
    return el;
  }
  // Deliberately synthetic: normalized deformation, not a material calibration.
  const deformation = force => (0.65 * force + 0.035 * force ** 2) / 10;
  // White printed mounting plate, dark drive rail, and paired finger brackets.
  node(scene, 'rect', { x:91, y:282, width:278, height:30, rx:5, fill:'#353b3b' });
  node(scene, 'rect', { x:78, y:271, width:304, height:20, rx:5, fill:'#fff', stroke:'#b9c0bd', 'stroke-width':2 });
  node(scene, 'rect', { x:205, y:290, width:50, height:24, rx:4, fill:'#e4e8e5', stroke:'#b9c0bd' });
  for (const x of [94, 185, 275, 366]) {
    node(scene, 'circle', { cx:x, cy:281, r:3, fill:'#555d59' });
  }
  node(scene, 'circle', { cx:230, cy:155, r:52, fill:'#e7e5e0', stroke:'#aaa', 'stroke-width':1.5 });
  node(scene, 'text', { x:230, y:160, 'text-anchor':'middle' }, 'Object');
  const ghosts = node(scene, 'g', { fill:'none', stroke:'#888', 'stroke-width':1.5, 'stroke-dasharray':'5 5' });
  const fingers = node(scene, 'g', {});
  // Closing the bases and tips while the middle remains in contact produces
  // a readable bending cue. Geometry is schematic, not a Fin Ray simulation.
  function point(t, inner, d, mirror) {
    const px = (inner ? 172 + 8 * t : 110 + 65 * t) + 25 * d * (1 - Math.sin(Math.PI * t));
    return [mirror ? 460 - px : px, 260 - 210 * t];
  }
  function outline(d, mirror) {
    const points = [];
    for (let i = 0; i <= 24; i++) points.push(point(i / 24, false, d, mirror));
    for (let i = 24; i >= 0; i--) points.push(point(i / 24, true, d, mirror));
    return points.map((p, i) => `${i ? 'L' : 'M'}${p.join(',')}`).join(' ') + ' Z';
  }
  for (const mirror of [false, true]) node(ghosts, 'path', { d:outline(0, mirror) });
  const shapeLabel = node(scene, 'text', { x:230, y:329, 'text-anchor':'middle' });
  function update() {
    const force = Number(slider.value);
    const d = deformation(force);
    fingers.replaceChildren();
    for (const mirror of [false, true]) {
      const group = node(fingers, 'g', { stroke:'#4f853b', 'stroke-width':3, 'stroke-linejoin':'round', 'stroke-linecap':'round' });
      node(group, 'path', { d:outline(d, mirror), fill:'#e4eedc' });
      for (let i = 1; i <= 10; i++) {
        const a = point(i / 12, false, d, mirror);
        const b = point(i / 12 + 0.065, true, d, mirror);
        node(group, 'line', { x1:a[0], y1:a[1], x2:b[0], y2:b[1], 'stroke-width':3.5 });
      }
      const pad = Array.from({ length:20 }, (_, i) => point(0.22 + i / 19 * 0.48, true, d, mirror));
      node(group, 'path', { d:pad.map((p, i) => `${i ? 'L' : 'M'}${p.join(',')}`).join(' '), fill:'none', stroke:'#353d36', 'stroke-width':6 });
      const base = point(0, false, d, mirror);
      const bracketX = mirror ? base[0] - 68 : base[0] - 6;
      node(group, 'rect', { x:bracketX, y:255, width:74, height:18, rx:3, fill:'#fff', stroke:'#b9c0bd', 'stroke-width':1.5 });
      for (const offset of [12, 62]) node(group, 'circle', { cx:bracketX + offset, cy:264, r:2.5, fill:'#59615a', stroke:'none' });
    }
    shapeLabel.textContent = force === 0 ? 'Unloaded reference' : `Illustrative load · ${force.toFixed(1)} N`;
    demo.querySelector('#gripper-force-value').textContent = `${force.toFixed(1)} N`;
    slider.setAttribute('aria-valuetext', `${force.toFixed(1)} newtons, illustrative load`);
    demo.querySelectorAll('[data-gripper-force]').forEach(button => button.setAttribute('aria-pressed', Number(button.dataset.gripperForce) === force));
  }
  slider.addEventListener('input', update);
  demo.querySelectorAll('[data-gripper-force]').forEach(button => button.addEventListener('click', () => {
    slider.value = button.dataset.gripperForce;
    update();
  }));
  update();
})();
