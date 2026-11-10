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
  const list = document.getElementById('annotations-list');
  const detail = document.getElementById('annotation-detail');
  const overlay = document.getElementById('annotation-overlay');
  const zoomValue = document.getElementById('zoom-value');
  const out = document.getElementById('zoom-out');
  const zoomIn = document.getElementById('zoom-in');
  const complete = document.getElementById('complete');
  const coupe = document.getElementById('coupe');
  const scroller = document.createElement('div');
  scroller.className = 'annotation-scroll';
  scroller.setAttribute('role', 'region');
  scroller.setAttribute('aria-label', 'Illustration annotée : faites défiler horizontalement pour voir tous les noms');
  scroller.tabIndex = 0;
  stage.before(scroller);
  scroller.append(stage);
  document.querySelector('.hint').textContent = 'Sur téléphone, faites défiler l’illustration horizontalement pour lire les noms. Utilisez la molette ou pincez l’image pour zoomer ; déplacez ensuite l’image agrandie à la souris, au doigt ou avec les flèches du clavier.';
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
  const pointers = new Map();
  let scale = 1, x = 0, y = 0, gesture = null, view = 2, selected = -1;
  const number = index => String(index + 1).padStart(2, '0');

  function render() {
    const size = Math.min(stage.clientWidth, stage.clientHeight);
    frame.style.width = `${size}px`;
    frame.style.height = `${size}px`;
    const maxX = Math.max(0, (size * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (size * scale - stage.clientHeight) / 2);
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    frame.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    frame.style.setProperty('--marker-scale', 1 / scale);
    stage.classList.toggle('is-zoomed', scale > 1);
    renderLines();
    zoomValue.textContent = `${Math.round(scale * 100)} %`;
    out.disabled = scale <= 1;
    zoomIn.disabled = scale >= 6;
  }
  function setScale(value) { scale = Math.max(1, Math.min(6, value)); render(); }
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
      button.textContent = number(index);
      button.dataset.part = index;
      button.setAttribute('aria-label', `${number(index)} · ${part[0]} — ${part[1]}`);
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
        button.setAttribute('aria-label', `${number(index)} · ${part[0]} — ${part[1]}`);
        button.setAttribute('aria-pressed', String(index === selected));
        const badge = document.createElement('span');
        badge.className = 'annotation-image-label-number';
        badge.textContent = number(index);
        const names = document.createElement('span');
        const pulaar = document.createElement('strong');
        pulaar.lang = 'ff'; pulaar.textContent = part[1];
        const french = document.createElement('span');
        french.textContent = part[0];
        names.append(pulaar, french); button.append(badge, names);
        button.addEventListener('click', () => selectPart(index));
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
      const left = label.parentElement === leftLabels;
      line.setAttribute('x1', left ? b.right - stageBox.left : b.left - stageBox.left);
      line.setAttribute('y1', b.top + b.height / 2 - stageBox.top);
      line.setAttribute('x2', p.left + p.width / 2 - stageBox.left);
      line.setAttribute('y2', p.top + p.height / 2 - stageBox.top);
      line.classList.toggle('active', Number(index) === selected);
    });
  }
  function renderSelection() {
    list.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === selected));
    });
    detail.replaceChildren();
    overlay.replaceChildren();
    overlay.hidden = selected < 0;
    if (selected < 0) {
      detail.textContent = 'Choisissez une partie du cœur pour afficher son nom en pulaar.';
      return;
    }
    const part = parts[selected];
    const label = document.createElement('span');
    label.className = 'annotation-detail-number';
    label.textContent = `#${number(selected)}`;
    const text = document.createElement('span');
    const french = document.createElement('strong');
    french.textContent = part[0];
    const pulaar = document.createElement('span');
    pulaar.className = 'annotation-detail-translation';
    pulaar.lang = 'ff';
    pulaar.textContent = part[1];
    text.append(french, pulaar);
    detail.append(label, text);
    overlay.append(label.cloneNode(true), text.cloneNode(true));
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
  parts.forEach((part, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'annotation-item';
    button.setAttribute('aria-pressed', 'false');
    const badge = document.createElement('span');
    badge.className = 'annotation-item-number';
    badge.textContent = `#${number(index)}`;
    const names = document.createElement('span');
    names.className = 'annotation-item-names';
    const french = document.createElement('strong');
    french.textContent = part[0];
    const pulaar = document.createElement('span');
    pulaar.lang = 'ff';
    pulaar.textContent = part[1];
    names.append(french, pulaar);
    button.append(badge, names);
    button.addEventListener('click', () => selectPart(index));
    item.append(button);
    list.append(item);
  });
  function beginGesture() {
    const p = [...pointers.values()];
    if (p.length >= 2) gesture = {distance: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), scale};
    else if (p.length === 1) gesture = {startX: p[0].x, startY: p[0].y, x, y};
    else gesture = null;
  }
  complete.addEventListener('click', () => setView(2));
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
  renderMarkers(); render();
  scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  if (document.fonts) document.fonts.ready.then(render);
})();
