(() => {
  const stage = document.getElementById('stage');
  const image = document.getElementById('heart-image');
  const zoomValue = document.getElementById('zoom-value');
  const out = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const complete = document.getElementById('complete');
  const coupe = document.getElementById('coupe');
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, gesture = null;

  function render() {
    const maxX = Math.max(0, (image.clientWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.clientHeight * scale - stage.clientHeight) / 2);
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    zoomValue.textContent = `${Math.round(scale * 100)} %`;
    out.disabled = scale <= 1;
    zoomIn.disabled = scale >= 6;
  }
  function setScale(value) { scale = Math.max(1, Math.min(6, value)); render(); }
  function setView(view) {
    const isComplete = view === 'complete';
    image.src = isComplete ? '/cardioatlas/coeur-complet.jpg' : '/cardioatlas/coeur-coupe.jpg';
    image.alt = isComplete ? 'Vue anatomique complète du cœur' : 'Vue anatomique du cœur en coupe';
    complete.classList.toggle('active', isComplete);
    coupe.classList.toggle('active', !isComplete);
    complete.setAttribute('aria-pressed', String(isComplete));
    coupe.setAttribute('aria-pressed', String(!isComplete));
    scale = 1; x = 0; y = 0; render();
  }
  function beginGesture() {
    const p = [...pointers.values()];
    if (p.length >= 2) gesture = {distance: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), scale};
    else if (p.length === 1) gesture = {startX: p[0].x, startY: p[0].y, x, y};
    else gesture = null;
  }
  complete.addEventListener('click', () => setView('complete'));
  coupe.addEventListener('click', () => setView('coupe'));
  out.addEventListener('click', () => setScale(scale / 1.25));
  zoomIn.addEventListener('click', () => setScale(scale * 1.25));
  stage.addEventListener('wheel', event => { event.preventDefault(); setScale(scale * Math.exp(-event.deltaY * 0.0015)); }, {passive:false});
  stage.addEventListener('keydown', event => {
    const movements = {ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40]};
    if (!movements[event.key] || scale <= 1) return;
    event.preventDefault();
    x += movements[event.key][0]; y += movements[event.key][1]; render();
  });
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
    beginGesture();
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
    const p = [...pointers.values()];
    if (p.length >= 2 && gesture.distance) setScale(gesture.scale * Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) / gesture.distance);
    else if (p.length === 1 && gesture.startX !== undefined) { x = gesture.x + p[0].x - gesture.startX; y = gesture.y + p[0].y - gesture.startY; render(); }
  });
  function endPointer(event) { pointers.delete(event.pointerId); beginGesture(); }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  image.addEventListener('load', render);
  window.addEventListener('resize', render);
  render();
})();
