/**
 * ƁERNDE 3D • Main Application Controller
 * Orchestrates 3D scene, Pulaar annotation studio, Web Audio heartbeat,
 * interactive study quiz, and multilingual localization.
 */

import { HeartScene } from './heart3d.js';
import { annotationStore, PULAAR_SPECIAL_CHARS, CATEGORIES } from './annotations.js';
import { heartAudio } from './audio.js';
import { PulaarHeartQuiz } from './quiz.js';

class BerndeApp {
  constructor() {
    this.currentLocale = 'ff'; // 'ff' (Pulaar), 'fr' (French), 'en' (English)
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.lastFocusedInput = null;

    this.initDOM();
    this.init3D();
    this.initQuiz();
    this.bindEvents();
    this.renderAnnotationList();
    this.updateLanguageUI();
  }

  initDOM() {
    this.container = document.getElementById('heart-canvas-container');
    this.annotationListEl = document.getElementById('annotation-list');
    this.searchInput = document.getElementById('search-input');
    this.hoverTooltip = document.getElementById('hover-tooltip');
    this.addPinNotice = document.getElementById('add-pin-notice');

    // Details Panel
    this.detailsPanel = document.getElementById('details-panel');
    this.panelTitle = document.getElementById('panel-title');
    this.panelTitleFr = document.getElementById('panel-title-fr');
    this.panelTitleEn = document.getElementById('panel-title-en');
    this.panelCategory = document.getElementById('panel-category');
    this.panelCoords = document.getElementById('panel-coords');
    this.panelDescPulaar = document.getElementById('panel-desc-pulaar');
    this.panelDescFr = document.getElementById('panel-desc-fr');
    this.panelFunFact = document.getElementById('panel-fun-fact');
    this.panelBtnEdit = document.getElementById('panel-btn-edit');
    this.panelBtnDelete = document.getElementById('panel-btn-delete');
    this.panelAudioBtn = document.getElementById('panel-audio-btn');

    // Modals
    this.annotationModal = document.getElementById('annotation-modal');
    this.quizModal = document.getElementById('quiz-modal');
    this.exportModal = document.getElementById('export-modal');
    this.helpModal = document.getElementById('help-modal');

    // Annotation Form
    this.annForm = document.getElementById('annotation-form');
    this.formId = document.getElementById('form-ann-id');
    this.formPosX = document.getElementById('form-ann-pos-x');
    this.formPosY = document.getElementById('form-ann-pos-y');
    this.formPosZ = document.getElementById('form-ann-pos-z');
    this.formTitlePulaar = document.getElementById('form-title-pulaar');
    this.formTitleFr = document.getElementById('form-title-fr');
    this.formCategory = document.getElementById('form-category');
    this.formDescPulaar = document.getElementById('form-desc-pulaar');
    this.formDescFr = document.getElementById('form-desc-fr');
    this.formFunFact = document.getElementById('form-funfact-pulaar');
    this.formColor = document.getElementById('form-color');

    // Track focused text inputs for virtual keyboard insertion
    const textInputs = [
      this.formTitlePulaar,
      this.formTitleFr,
      this.formDescPulaar,
      this.formDescFr,
      this.formFunFact,
      this.searchInput
    ];
    textInputs.forEach(input => {
      if (input) {
        input.addEventListener('focus', () => {
          this.lastFocusedInput = input;
        });
      }
    });
    this.lastFocusedInput = this.formTitlePulaar;
  }

  init3D() {
    this.scene = new HeartScene(this.container);

    // Initial pins populate
    this.scene.updatePins(annotationStore.getAll());

    // Hook callbacks
    this.scene.onSelectPin = (id) => {
      this.selectAnnotation(id);
    };

    this.scene.onHoverPart = (title, data) => {
      // Suppress hover tooltip during quiz so it does not give away answers
      if (this.quiz && this.quiz.isActive) {
        this.hoverTooltip.classList.remove('visible');
        return;
      }
      if (title) {
        this.hoverTooltip.textContent = title;
        this.hoverTooltip.classList.add('visible');
      } else {
        this.hoverTooltip.classList.remove('visible');
      }
    };

    this.scene.onAddPinCoords = (pos) => {
      this.openAddAnnotationModal(pos);
    };

    this.scene.onAddPinModeChange = (active) => {
      const addPinBtn = document.getElementById('btn-add-pin');
      if (addPinBtn) addPinBtn.classList.toggle('btn-active', active);
      if (this.addPinNotice) this.addPinNotice.style.display = active ? 'block' : 'none';
    };

    // Store sync
    annotationStore.subscribe((annotations, selectedId) => {
      this.scene.updatePins(annotations, selectedId);
      this.renderAnnotationList();
      if (selectedId) {
        const item = annotationStore.getById(selectedId);
        if (item) this.populateDetailsPanel(item);
      }
    });
  }

  initQuiz() {
    this.quiz = new PulaarHeartQuiz(annotationStore, this.scene);
    this.quiz.onStateChange = (state) => this.handleQuizState(state);
  }

  bindEvents() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    sidebarToggle.addEventListener('click', () => {
      this.setSidebarOpen(!document.getElementById('anatomy-sidebar').classList.contains('open'));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.getElementById('anatomy-sidebar').classList.contains('open')) {
        this.setSidebarOpen(false);
        sidebarToggle.focus();
      }
    });
    // 1. Language switcher buttons
    document.getElementById('lang-ff').addEventListener('click', () => this.setLocale('ff'));
    document.getElementById('lang-fr').addEventListener('click', () => this.setLocale('fr'));
    document.getElementById('lang-en').addEventListener('click', () => this.setLocale('en'));

    // 2. Add Pin button toggle
    const addPinBtn = document.getElementById('btn-add-pin');
    addPinBtn.addEventListener('click', () => {
      const active = !this.scene.isAddPinMode;
      this.scene.setAddPinMode(active);
    });

    // 3. Search & Category filtering
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.renderAnnotationList();
    });

    document.querySelectorAll('.category-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.category-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeCategory = chip.dataset.cat;
        this.renderAnnotationList();
      });
    });

    // 4. Details panel actions
    document.getElementById('panel-close-btn').addEventListener('click', () => {
      this.detailsPanel.classList.remove('open');
      annotationStore.select(null);
    });

    this.panelBtnEdit.addEventListener('click', () => {
      if (annotationStore.selectedId) {
        const item = annotationStore.getById(annotationStore.selectedId);
        if (item) this.openEditAnnotationModal(item);
      }
    });

    this.panelBtnDelete.addEventListener('click', () => {
      if (annotationStore.selectedId) {
        const item = annotationStore.getById(annotationStore.selectedId);
        if (!item) return;

        const confirmMsg = this.currentLocale === 'ff'
          ? `Aɗa felliti aɗa yiɗi momtude ñoŋal "${item.title_pulaar}"?`
          : `Êtes-vous sûr de vouloir supprimer l'annotation "${item.title_pulaar}" ?`;

        if (confirm(confirmMsg)) {
          annotationStore.remove(item.id);
          this.detailsPanel.classList.remove('open');
        }
      }
    });

    this.panelAudioBtn.addEventListener('click', () => {
      if (annotationStore.selectedId) {
        const item = annotationStore.getById(annotationStore.selectedId);
        if (item) this.speakPulaar(item.title_pulaar);
      }
    });

    // 5. Camera orientation preset buttons
    document.querySelectorAll('.view-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.scene.resetCameraView(btn.dataset.view);
      });
    });

    // 6. Bottom Cardiac Cycle Controls
    const playPauseBtn = document.getElementById('btn-play-pause');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const playLabel = document.getElementById('play-label');

    playPauseBtn.addEventListener('click', () => {
      this.scene.isPlaying = !this.scene.isPlaying;
      playIcon.style.display = this.scene.isPlaying ? 'none' : 'block';
      pauseIcon.style.display = this.scene.isPlaying ? 'block' : 'none';
      playLabel.textContent = this.scene.isPlaying ? 'Fiifngo' : 'Dartinaa';
      playPauseBtn.classList.toggle('btn-primary', this.scene.isPlaying);
    });

    const bpmSlider = document.getElementById('bpm-slider');
    const bpmVal = document.getElementById('bpm-val');
    bpmSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.scene.setBpm(val);
      bpmVal.textContent = `${val} BPM`;
    });

    const audioToggleBtn = document.getElementById('btn-audio-toggle');
    const audioLabel = document.getElementById('audio-status-label');
    audioToggleBtn.addEventListener('click', () => {
      const enabled = heartAudio.toggle();
      audioLabel.textContent = enabled ? 'Sawto: ON' : 'Sawto: OFF';
      audioToggleBtn.classList.toggle('btn-active', enabled);
    });

    // 7. Render Modes
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.scene.setRenderMode(btn.dataset.mode);
      });
    });

    // 8. Toggles (Cross-section, blood flow, pins)
    const crossSectionBtn = document.getElementById('btn-cross-section');
    crossSectionBtn.addEventListener('click', () => {
      const active = !this.scene.isCrossSection;
      this.scene.setCrossSection(active);
      crossSectionBtn.classList.toggle('btn-active', active);
    });

    const bloodFlowBtn = document.getElementById('btn-blood-flow');
    bloodFlowBtn.addEventListener('click', () => {
      const active = !this.scene.showBloodFlow;
      this.scene.setBloodFlow(active);
      bloodFlowBtn.classList.toggle('btn-active', active);
    });

    const togglePinsBtn = document.getElementById('btn-toggle-pins');
    togglePinsBtn.addEventListener('click', () => {
      const active = !this.scene.showAnnotations;
      this.scene.setAnnotationsVisible(active);
      togglePinsBtn.classList.toggle('btn-active', active);
    });

    // 9. Virtual Pulaar Keyboard Buttons
    document.querySelectorAll('.pulaar-key-btn').forEach(btn => {
      // Prevent button click from stealing focus from the active input
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
      });
      btn.addEventListener('click', () => {
        const char = btn.dataset.char;
        this.insertCharIntoActiveInput(char);
      });
    });

    // 10. Annotation Form Submit / Cancel
    document.getElementById('modal-ann-submit').addEventListener('click', () => {
      this.submitAnnotationForm();
    });

    document.getElementById('modal-ann-cancel').addEventListener('click', () => {
      this.closeModal(this.annotationModal);
    });
    document.getElementById('modal-ann-close').addEventListener('click', () => {
      this.closeModal(this.annotationModal);
    });

    // 11. Quiz Modal Open / Close
    document.getElementById('btn-quiz').addEventListener('click', () => {
      this.openModal(this.quizModal);
      this.quiz.start();
    });
    document.getElementById('quiz-close-btn').addEventListener('click', () => {
      this.quiz.stop();
      this.closeModal(this.quizModal);
    });
    document.getElementById('quiz-next-btn').addEventListener('click', () => {
      this.quiz.nextQuestion();
    });

    // 12. Screenshot Capture
    document.getElementById('btn-screenshot').addEventListener('click', () => {
      this.takeScreenshot();
    });

    // 13. Export & Import Modal
    document.getElementById('btn-export-menu').addEventListener('click', () => {
      this.openModal(this.exportModal);
    });
    document.getElementById('export-close-btn').addEventListener('click', () => {
      this.closeModal(this.exportModal);
    });

    document.getElementById('btn-download-json').addEventListener('click', () => {
      this.downloadJSON();
    });

    const importInput = document.getElementById('import-json-file');
    document.getElementById('btn-trigger-import').addEventListener('click', () => {
      importInput.click();
    });
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          annotationStore.importJSON(event.target.result);
          alert(this.currentLocale === 'ff' ? "Ñoŋi ɗii naatnaama no moƴƴi!" : "Annotations importées avec succès !");
          this.closeModal(this.exportModal);
        } catch (err) {
          alert("Erreur lors de l'import JSON: " + err.message);
        } finally {
          importInput.value = '';
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset-defaults').addEventListener('click', () => {
      if (confirm(this.currentLocale === 'ff' ? "Aɗa felliti aɗa yiɗi artirde ñoŋi asliiji ɗii?" : "Réinitialiser toutes les annotations par défaut ?")) {
        annotationStore.resetToDefault();
        this.closeModal(this.exportModal);
      }
    });

    // 14. Help Modal
    document.getElementById('btn-help').addEventListener('click', () => {
      this.openModal(this.helpModal);
    });
    document.getElementById('help-close-btn').addEventListener('click', () => {
      this.closeModal(this.helpModal);
    });
  }

  insertCharIntoActiveInput(char) {
    const input = this.lastFocusedInput || this.formTitlePulaar || this.searchInput;
    if (!input) return;

    input.focus();
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const val = input.value;
    input.value = val.substring(0, start) + char + val.substring(end);
    input.selectionStart = input.selectionEnd = start + char.length;

    // Trigger input event for search
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  renderAnnotationList() {
    const all = annotationStore.getAll();
    document.getElementById('count-all').textContent = all.length;

    // Filter by category and search text
    const filtered = all.filter(item => {
      const matchesCategory = this.activeCategory === 'all' || item.category === this.activeCategory;
      if (!matchesCategory) return false;

      if (!this.searchQuery) return true;

      const q = this.searchQuery;
      const titleFf = (item.title_pulaar || '').toLowerCase();
      const titleFr = (item.title_fr || '').toLowerCase();
      const titleEn = (item.title_en || '').toLowerCase();
      const descFf = (item.description_pulaar || '').toLowerCase();
      return titleFf.includes(q) || titleFr.includes(q) || titleEn.includes(q) || descFf.includes(q);
    });

    this.annotationListEl.innerHTML = '';

    if (filtered.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '20px 10px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = 'var(--text-dim)';
      emptyDiv.style.fontSize = '0.85rem';
      emptyDiv.textContent = this.currentLocale === 'ff' ? 'Alaa ñoŋal tawondiraangal...' : 'Aucune annotation trouvée...';
      this.annotationListEl.appendChild(emptyDiv);
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement('div');
      row.className = `annotation-item ${item.id === annotationStore.selectedId ? 'selected' : ''}`;
      row.dataset.id = item.id;

      const badge = document.createElement('div');
      badge.className = 'item-badge';
      badge.style.color = item.color || '#e63946';

      const content = document.createElement('div');
      content.className = 'item-content';

      const title = document.createElement('div');
      title.className = 'item-title';
      title.textContent = item.title_pulaar;

      const sub = document.createElement('div');
      sub.className = 'item-sub';
      sub.textContent = item.title_fr || item.title_en || (CATEGORIES[item.category]?.name_pulaar || '');

      content.appendChild(title);
      content.appendChild(sub);

      row.appendChild(badge);
      row.appendChild(content);

      if (item.custom) {
        const customBadge = document.createElement('span');
        customBadge.className = 'custom-tag';
        customBadge.textContent = 'Keso';
        row.appendChild(customBadge);
      }

      row.addEventListener('click', () => {
        this.selectAnnotation(item.id);
      });

      this.annotationListEl.appendChild(row);
    });
  }

  selectAnnotation(id) {
    const item = annotationStore.getById(id);
    if (!item) return;

    this.setSidebarOpen(false);

    annotationStore.select(id);
    this.populateDetailsPanel(item);
    this.detailsPanel.classList.add('open');
    this.scene.flyTo(item.position, 2.8);
    this.renderAnnotationList();
  }

  populateDetailsPanel(item) {
    this.panelTitle.textContent = item.title_pulaar;
    this.panelTitleFr.textContent = item.title_fr ? `FR: ${item.title_fr}` : 'FR: -';
    this.panelTitleEn.textContent = item.title_en ? `EN: ${item.title_en}` : 'EN: -';

    const catData = CATEGORIES[item.category] || CATEGORIES.other;
    this.panelCategory.textContent = this.currentLocale === 'ff' ? catData.name_pulaar : catData.name_fr;
    this.panelCategory.style.background = `${catData.color}25`;
    this.panelCategory.style.color = catData.color;

    this.panelCoords.textContent = `XYZ: (${item.position.x.toFixed(2)}, ${item.position.y.toFixed(2)}, ${item.position.z.toFixed(2)})`;

    this.panelDescPulaar.textContent = item.description_pulaar || 'Alaa bayyinaango e Pulaar...';
    this.panelDescFr.textContent = item.description_fr || 'Pas de description médicale en français.';
    this.panelFunFact.textContent = item.fun_fact_pulaar || 'Kala taƴre ɓernde ina jogii nafoore mawnde e nguurndam.';

    this.panelBtnDelete.style.display = 'block';
  }

  openAddAnnotationModal(pos) {
    document.getElementById('modal-annotation-title').textContent = this.currentLocale === 'ff'
      ? 'Faw Ñoŋal Keso e Pulaar'
      : 'Ajouter une annotation en Pulaar';

    this.formId.value = '';
    this.formPosX.value = pos.x.toFixed(3);
    this.formPosY.value = pos.y.toFixed(3);
    this.formPosZ.value = pos.z.toFixed(3);

    this.formTitlePulaar.value = '';
    this.formTitleFr.value = '';
    this.formCategory.value = 'chamber';
    this.formDescPulaar.value = '';
    this.formDescFr.value = '';
    this.formFunFact.value = '';
    this.formColor.value = '#e63946';

    this.openModal(this.annotationModal);
    this.formTitlePulaar.focus();
    this.lastFocusedInput = this.formTitlePulaar;
  }

  openEditAnnotationModal(item) {
    document.getElementById('modal-annotation-title').textContent = this.currentLocale === 'ff'
      ? `Waylu: ${item.title_pulaar}`
      : `Modifier: ${item.title_pulaar}`;

    this.formId.value = item.id;
    this.formPosX.value = item.position.x;
    this.formPosY.value = item.position.y;
    this.formPosZ.value = item.position.z;

    this.formTitlePulaar.value = item.title_pulaar || '';
    this.formTitleFr.value = item.title_fr || '';
    this.formCategory.value = item.category || 'chamber';
    this.formDescPulaar.value = item.description_pulaar || '';
    this.formDescFr.value = item.description_fr || '';
    this.formFunFact.value = item.fun_fact_pulaar || '';
    this.formColor.value = item.color || '#e63946';

    this.openModal(this.annotationModal);
    this.formTitlePulaar.focus();
    this.lastFocusedInput = this.formTitlePulaar;
  }

  submitAnnotationForm() {
    const titlePulaar = this.formTitlePulaar.value.trim();
    if (!titlePulaar) {
      alert("Tiiɗno winndu innde ndee e Pulaar (Veuillez renseigner le nom en Pulaar).");
      this.formTitlePulaar.focus();
      return;
    }

    const id = this.formId.value;
    const data = {
      title_pulaar: titlePulaar,
      title_fr: this.formTitleFr.value.trim(),
      category: this.formCategory.value,
      position: {
        x: parseFloat(this.formPosX.value) || 0,
        y: parseFloat(this.formPosY.value) || 0,
        z: parseFloat(this.formPosZ.value) || 0
      },
      description_pulaar: this.formDescPulaar.value.trim(),
      description_fr: this.formDescFr.value.trim(),
      fun_fact_pulaar: this.formFunFact.value.trim(),
      color: this.formColor.value
    };

    if (id) {
      annotationStore.update(id, data);
    } else {
      const created = annotationStore.add(data);
      annotationStore.select(created.id);
    }

    this.closeModal(this.annotationModal);
  }

  handleQuizState(state) {
    if (!state.isActive) {
      this.closeModal(this.quizModal);
      return;
    }

    document.getElementById('quiz-score').textContent = `${state.score} / ${state.total}`;
    document.getElementById('quiz-streak').textContent = state.streak;

    const q = state.question;
    if (!q) return;

    document.getElementById('quiz-prompt').textContent = q.prompt;
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      const title = document.createElement('span');
      title.textContent = opt.title_pulaar;
      const subtitle = document.createElement('small');
      subtitle.style.color = 'var(--text-muted)';
      subtitle.style.fontSize = '0.75rem';
      subtitle.textContent = opt.title_fr || '';
      btn.append(title, subtitle);

      if (q.answered) {
        btn.disabled = true;
        if (opt.id === q.target.id) {
          btn.classList.add('correct');
        } else if (opt.id === q.userAnswer) {
          btn.classList.add('wrong');
        }
      } else {
        btn.addEventListener('click', () => {
          this.quiz.submitAnswer(opt.id);
        });
      }

      optionsContainer.appendChild(btn);
    });

    const feedbackEl = document.getElementById('quiz-feedback');
    const feedbackText = document.getElementById('quiz-feedback-text');

    if (q.answered) {
      feedbackEl.style.display = 'flex';
      feedbackEl.className = `quiz-feedback ${q.isCorrect ? 'correct' : 'wrong'}`;
      feedbackText.textContent = state.feedback;
    } else {
      feedbackEl.style.display = 'none';
    }
  }

  speakPulaar(text) {
    if (!('speechSynthesis' in window)) {
      alert("Votre navigateur ne supporte pas la synthèse vocale.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    // Prefer African French / French voice if Fulani not installed on OS
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('fr') || v.lang.startsWith('ff'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  takeScreenshot() {
    const dataUrl = this.scene.captureSnapshot();
    const link = document.createElement('a');
    link.download = `bernde-3d-pulaar-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  downloadJSON() {
    const jsonStr = annotationStore.exportJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'bernde-pulaar-annotations.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  setLocale(locale) {
    this.currentLocale = locale;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`lang-${locale}`).classList.add('active');
    this.updateLanguageUI();
    this.renderAnnotationList();
    if (annotationStore.selectedId) {
      const item = annotationStore.getById(annotationStore.selectedId);
      if (item) this.populateDetailsPanel(item);
    }
  }

  setSidebarOpen(open) {
    document.getElementById('anatomy-sidebar').classList.toggle('open', open);
    document.getElementById('sidebar-toggle').setAttribute('aria-expanded', String(open));
    this.updateSidebarToggle();
  }

  updateSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const open = toggle.getAttribute('aria-expanded') === 'true';
    const labels = {
      ff: ['Taƴɗe ɓernde', 'Uddu doggol'],
      fr: ['Structures', 'Fermer la liste'],
      en: ['Structures', 'Close list']
    };
    toggle.textContent = labels[this.currentLocale][open ? 1 : 0];
  }

  updateLanguageUI() {
    this.updateSidebarToggle();
    const t = {
      ff: {
        addPin: '+ Ñoŋal Keso',
        quiz: 'Jarribo',
        capture: 'Nate (PNG)',
        export: 'Jokkondire',
        searchPlaceholder: 'Yiylo taƴre e Pulaar...'
      },
      fr: {
        addPin: '+ Annotation',
        quiz: 'Quiz Cardio',
        capture: 'Capture (PNG)',
        export: 'Export / Import',
        searchPlaceholder: 'Rechercher une partie anatomique...'
      },
      en: {
        addPin: '+ Add Pin',
        quiz: 'Heart Quiz',
        capture: 'Capture (PNG)',
        export: 'Export / Import',
        searchPlaceholder: 'Search cardiac anatomy...'
      }
    }[this.currentLocale];

    document.querySelector('.i18n-add-pin').textContent = t.addPin;
    document.querySelector('.i18n-quiz').textContent = t.quiz;
    document.querySelector('.i18n-capture').textContent = t.capture;
    document.querySelector('.i18n-export').textContent = t.export;
    this.searchInput.placeholder = t.searchPlaceholder;
  }

  openModal(modal) {
    modal.classList.add('open');
  }

  closeModal(modal) {
    modal.classList.remove('open');
    if (modal === this.annotationModal && this.scene && this.scene.isAddPinMode) {
      this.scene.setAddPinMode(false);
    }
  }
}

// Bootstrap on DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  window.berndeApp = new BerndeApp();
});
