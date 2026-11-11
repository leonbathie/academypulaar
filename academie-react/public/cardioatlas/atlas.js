(() => {
  // Positions reprises de l'atlas fourni : coordonnées en pourcentage de l'image carrée.
  const parts = [
    ['Atrium droit (Oreillette droite)', 'Nofel ñaamel', [31, 46], [31, 45]],
    ['Ventricule droit', 'Deerel ñaamel', [44, 64], [43, 74]],
    ['Atrium gauche (Oreillette gauche)', 'Nofel nanel', [63, 41], [64, 42]],
    ['Ventricule gauche', 'Deerel nanel', [67, 66], [63, 73]],
    ['Septum interventriculaire', 'Gallol hakkundeeron', null, [53, 71]],
    ['Valve tricuspide', 'Udmaare seettatiire', null, [34, 56]],
    ['Valve mitrale (Bicuspide)', 'Udmaare Kufniire', null, [63, 52]],
    ['Valve pulmonaire (Sigmoïde)', 'Udmaare jofiire (sigmiire)', null, [46, 47]],
    ['Valve aortique (Sigmoïde)', 'Udumere sarduure', null, [54, 50]],
    ['Cordages tendineux & Muscles papillaires', 'Gaacirɗi raɗolinɗi', null, [38, 65]],
    ['Veine cave supérieure (VCS)', 'Gartirol lompol dowrowol', [35, 21], [34, 20]],
    ['Veine cave inférieure (VCI)', 'Gartirol lompol leswol', [37, 85], [34, 84]],
    ["Crosse de l'aorte & Tronc artériel", 'Hofru Sardu e fooɓre naɓrol', [50, 22], [48, 21]],
    ['Tronc pulmonaire & Artères pulmonaires', 'Fooɓre  jofe e naɓruɗi  jofe', [53, 35], [53, 33]],
    ['Veines pulmonaires (Droites et Gauches)', 'Gartirɗi jofe ñaami e nani', [74, 40], [76, 38]],
    ['Myocarde, Endocarde & Épicarde', 'Ketɓero', [52, 47], [74, 66]],
    ['Apex du cœur (Pointe cardiaque)', 'Seɓre Ɓernde (Hooɓre)', [64, 90], [64, 90]],
    ['Système Cardionecteur (Nœuds SA/AV & Faisceau de His)', 'Fiɓre nofru reeduure e haɓɓere His', null, [49, 58]],
    ['Artère interventriculaire antérieure (IVA / LAD)', 'Naɓrol hakkundeeron yeesowol', [57, 63], null],
    ['Artère coronaire droite (ACD)', 'Naɓrol ɓernde ñaamol', [38, 55], null],
    ['Artère circonflexe (Cx)', 'Naɓrol wertaangowol', [68, 53], null],
    ['Grande veine cardiaque & Sinus coronaire', 'Gartiral ɓernde e hofiinde ɓernde', [55, 56], null]
  ];
  const stage = document.getElementById('stage');
  const frame = document.getElementById('heart-frame');
  const image = document.getElementById('heart-image');
  const markers = document.getElementById('heart-markers');
  const overlay = document.getElementById('annotation-overlay');
  const zoomValue = document.getElementById('zoom-value');
  const out = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const complete = document.getElementById('complete');
  const coupe = document.getElementById('coupe');
  const numberToggle = document.getElementById('toggle-numbers');
  const atlas = document.querySelector('.atlas');
  const scroller = document.createElement('div');
  scroller.className = 'annotation-scroll';
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', 'Illustration annotée : faites défiler horizontalement pour voir tous les noms');
  scroller.tabIndex = 0;
  stage.before(scroller);
  scroller.append(stage);
  document.querySelector('.hint').textContent = 'Sur téléphone, faites défiler l’illustration horizontalement pour lire les noms. Utilisez la molette ou pincez l’image pour zoomer. Déplacez les noms en les faisant glisser, ou sélectionnez-les au clavier puis utilisez les flèches.';
  const labels = document.createElement('div');
  labels.className = 'annotation-labels';
  const svgNS = 'http://www.w3.org/2000/svg';
  const lines = document.createElementNS(svgNS, 'svg');
  lines.classList.add('annotation-lines');
  lines.setAttribute('aria-hidden', 'true');
  const leftLabels = document.createElement('div');
  leftLabels.className = 'annotation-label-column annotation-label-column-left';
  const rightLabels = document.createElement('div');
  rightLabels.className = 'annotation-label-column annotation-label-column-right';
  labels.append(lines, leftLabels, rightLabels);
  stage.append(labels);
  // Garder les déplacements propres à chaque vue pendant la session.
  const labelPositions = new Map();
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, gesture = null, view = 2, selected = -1;
  let beat = 1, animationFrame = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const number = index => String(index + 1).padStart(2, '0');

  function paintHeart() {
    const effectiveScale = scale * beat;
    frame.style.transform = `translate(${x}px, ${y}px) scale(${effectiveScale})`;
    frame.style.setProperty('--marker-scale', 1 / effectiveScale);
    renderLines();
  }
  function animateHeart(time) {
    animationFrame = null;
    if (reducedMotion.matches || document.hidden) return;
    // Deux contractions douces par cycle, synchronisées avec les repères.
    const phase = (time % 1200) / 1200;
    const pulse = (start, duration) => {
      const progress = (phase - start) / duration;
      return progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 2 : 0;
    };
    beat = 1 + 0.035 * pulse(0, 0.23) + 0.022 * pulse(0.27, 0.2);
    paintHeart();
    animationFrame = requestAnimationFrame(animateHeart);
  }
  function updateAnimation() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    beat = 1;
    paintHeart();
    if (!reducedMotion.matches && !document.hidden) animationFrame = requestAnimationFrame(animateHeart);
  }
  function render() {
    const size = Math.min(stage.clientWidth, stage.clientHeight);
    frame.style.width = `${size}px`;
    frame.style.height = `${size}px`;
    const maxX = Math.max(0, (size * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (size * scale - stage.clientHeight) / 2);
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    paintHeart();
    stage.classList.toggle('is-zoomed', scale > 1);
    zoomValue.textContent = `${Math.round(scale * 100)} %`;
    out.disabled = scale <= 0.5;
    zoomIn.disabled = scale >= 6;
  }
  function setScale(value) { scale = Math.max(0.5, Math.min(6, value)); render(); }
  function renderMarkers() {
    markers.replaceChildren();
    parts.forEach((part, index) => {
      const point = part[view];
      if (!point) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'annotation-marker';
      button.style.left = `${point[0]}%`;
      button.style.top = `${point[1]}%`;
      button.dataset.part = index;
      const markerNumber = document.createElement('span');
      markerNumber.className = 'annotation-marker-number';
      markerNumber.textContent = number(index);
      markerNumber.setAttribute('aria-hidden', 'true');
      button.append(markerNumber);
      button.setAttribute('aria-label', `${part[0]} — ${part[1]}`);
      button.setAttribute('aria-pressed', String(index === selected));
      button.addEventListener('click', () => selectPart(index));
      markers.append(button);
    });
    renderLabels();
  }
  function renderLabels() {
    leftLabels.replaceChildren(); rightLabels.replaceChildren(); lines.replaceChildren();
    const visible = parts.map((part, index) => ({part, index, point: part[view]})).filter(item => item.point);
    visible.sort((a, b) => a.point[0] - b.point[0]);
    const middle = Math.ceil(visible.length / 2);
    [visible.slice(0, middle), visible.slice(middle)].forEach((column, side) => {
      column.sort((a, b) => a.point[1] - b.point[1]);
      column.forEach(({part, index}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'annotation-image-label';
        button.dataset.part = index;
        button.setAttribute('aria-label', `${part[0]} — ${part[1]}`);
        button.setAttribute('aria-pressed', String(index === selected));
        button.setAttribute('aria-description', 'Déplacez ce nom avec les flèches du clavier ou faites-le glisser.');
        const saved = labelPositions.get(`${view}:${index}`);
        if (saved) applyLabelPosition(button, saved.x, saved.y);
        makeLabelMovable(button, index);
        const badge = document.createElement('span');
        badge.className = 'annotation-image-label-number';
        badge.textContent = number(index);
        badge.setAttribute('aria-hidden', 'true');
        const names = document.createElement('span');
        const pulaar = document.createElement('strong');
        pulaar.lang = 'ff'; pulaar.textContent = part[1];
        const french = document.createElement('span');
        french.textContent = part[0];
        names.append(pulaar, french); button.append(badge, names);
        (side === 0 ? leftLabels : rightLabels).append(button);
        const line = document.createElementNS(svgNS, 'line');
        line.dataset.part = index;
        lines.append(line);
      });
    });
  }
  function renderLines() {
    const stageBox = stage.getBoundingClientRect();
    lines.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
    lines.querySelectorAll('line').forEach(line => {
      const index = line.dataset.part;
      const point = markers.querySelector(`[data-part="${index}"]`);
      const label = labels.querySelector(`button[data-part="${index}"]`);
      if (!point || !label) return;
      const p = point.getBoundingClientRect(), b = label.getBoundingClientRect();
      const markerX = p.left + p.width / 2;
      const labelX = b.left + b.width / 2;
      line.setAttribute('x1', markerX >= labelX ? b.right - stageBox.left : b.left - stageBox.left);
      line.setAttribute('y1', b.top + b.height / 2 - stageBox.top);
      line.setAttribute('x2', p.left + p.width / 2 - stageBox.left);
      line.setAttribute('y2', p.top + p.height / 2 - stageBox.top);
      line.classList.toggle('active', Number(index) === selected);
    });
  }
  function applyLabelPosition(button, dx, dy) {
    button.dataset.offsetX = dx;
    button.dataset.offsetY = dy;
    button.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  function moveLabel(button, index, dx, dy) {
    const stageBox = stage.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    const oldX = Number(button.dataset.offsetX || 0), oldY = Number(button.dataset.offsetY || 0);
    // La position reste dans l'illustration, y compris sur écran tactile.
    const nextX = Math.max(oldX + stageBox.left - box.left, Math.min(oldX + stageBox.right - box.right, dx));
    const nextY = Math.max(oldY + stageBox.top - box.top, Math.min(oldY + stageBox.bottom - box.bottom, dy));
    applyLabelPosition(button, nextX, nextY);
    labelPositions.set(`${view}:${index}`, {x: nextX, y: nextY});
    renderLines();
  }
  function makeLabelMovable(button, index) {
    let drag = null, suppressClick = false;
    button.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY,
        offsetX: Number(button.dataset.offsetX || 0), offsetY: Number(button.dataset.offsetY || 0), moved: false};
      button.setPointerCapture(event.pointerId);
      button.classList.add('is-dragging');
    });
    button.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (Math.hypot(dx, dy) > 3) drag.moved = true;
      if (drag.moved) moveLabel(button, index, drag.offsetX + dx, drag.offsetY + dy);
    });
    function endDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      suppressClick = drag.moved;
      drag = null;
      button.classList.remove('is-dragging');
      // Un pointercancel ne produit pas de click ; ne pas bloquer le prochain.
      if (event.type === 'pointercancel') suppressClick = false;
    }
    button.addEventListener('pointerup', endDrag);
    button.addEventListener('pointercancel', endDrag);
    button.addEventListener('click', event => {
      if (suppressClick) { suppressClick = false; event.preventDefault(); return; }
      selectPart(index);
    });
    button.addEventListener('keydown', event => {
      const directions = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault(); event.stopPropagation();
      const step = event.shiftKey ? 20 : 5;
      moveLabel(button, index, Number(button.dataset.offsetX || 0) + step * direction[0], Number(button.dataset.offsetY || 0) + step * direction[1]);
    });
  }
  function renderSelection() {
    overlay.replaceChildren();
    overlay.hidden = selected < 0;
    if (selected < 0) return;
    const part = parts[selected];
    const label = document.createElement('span');
    label.className = 'annotation-detail-number';
    label.textContent = `#${number(selected)}`;
    label.setAttribute('aria-hidden', 'true');
    const text = document.createElement('span');
    const french = document.createElement('strong');
    french.textContent = part[0];
    const pulaar = document.createElement('span');
    pulaar.className = 'annotation-detail-translation';
    pulaar.lang = 'ff';
    pulaar.textContent = part[1];
    text.append(french, pulaar);
    overlay.append(label, text);
  }
  function setView(nextView) {
    view = nextView;
    const isComplete = view === 2;
    image.src = isComplete ? '/cardioatlas/coeur-complet.jpg' : '/cardioatlas/coeur-coupe.jpg';
    image.alt = isComplete ? 'Vue anatomique complète du cœur' : 'Vue anatomique du cœur en coupe';
    complete.classList.toggle('active', isComplete);
    coupe.classList.toggle('active', !isComplete);
    complete.setAttribute('aria-pressed', String(isComplete));
    coupe.setAttribute('aria-pressed', String(!isComplete));
    if (selected >= 0 && !parts[selected][view]) selected = -1;
    scale = 1; x = 0; y = 0;
    renderMarkers(); renderSelection(); render();
  }
  function selectPart(index) {
    if (!parts[index][view]) setView(view === 2 ? 3 : 2);
    selected = index;
    renderSelection();
    // Mettre à jour les boutons existants sans déplacer le focus clavier.
    markers.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.part) === index));
    });
    labels.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.part) === index));
    });
    renderLines();
  }
  function beginGesture() {
    const p = [...pointers.values()];
    if (p.length >= 2) gesture = {distance: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), scale};
    else if (p.length === 1) gesture = {startX: p[0].x, startY: p[0].y, x, y};
    else gesture = null;
  }
  complete.addEventListener('click', () => setView(2));
  numberToggle.addEventListener('click', () => {
    const show = numberToggle.getAttribute('aria-pressed') !== 'true';
    numberToggle.setAttribute('aria-pressed', String(show));
    numberToggle.textContent = show ? 'Masquer les numéros' : 'Afficher les numéros';
    atlas.classList.toggle('show-numbers', show);
    renderLines();
  });
  coupe.addEventListener('click', () => setView(3));
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
    if (event.target.closest('button')) return;
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
  reducedMotion.addEventListener('change', updateAnimation);
  document.addEventListener('visibilitychange', updateAnimation);
  renderMarkers(); render();
  updateAnimation();
  scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  if (document.fonts) document.fonts.ready.then(render);
})();
