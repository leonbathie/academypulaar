/**
 * Pulaar Cardiac Anatomy Annotation Store & Manager
 * Provides culturally & medically accurate Pulaar terms, coordinates on the 3D heart,
 * descriptions, and full CRUD operations with localStorage persistence.
 */

export const PULAAR_SPECIAL_CHARS = [
  'ɓ', 'ɗ', 'ƴ', 'ŋ', 'ñ',
  'Ɓ', 'Ɗ', 'Ƴ', 'Ŋ', 'Ñ'
];

export const CATEGORIES = {
  chamber: {
    id: 'chamber',
    name_pulaar: 'Suudu ɓernde',
    name_fr: 'Chambre cardiaque',
    color: '#e63946',
    icon: 'heart'
  },
  vessel: {
    id: 'vessel',
    name_pulaar: 'Ɗadol ƴiiƴam',
    name_fr: 'Vaisseau sanguin',
    color: '#457b9d',
    icon: 'activity'
  },
  valve: {
    id: 'valve',
    name_pulaar: 'Ombirgal ɓernde',
    name_fr: 'Valvule cardiaque',
    color: '#f4a261',
    icon: 'shield'
  },
  tissue: {
    id: 'tissue',
    name_pulaar: 'Teewu ɓernde',
    name_fr: 'Tissu & Muscle',
    color: '#9d0208',
    icon: 'layers'
  },
  other: {
    id: 'other',
    name_pulaar: 'Goɗɗum',
    name_fr: 'Autre structure',
    color: '#2a9d8f',
    icon: 'pin'
  }
};

export const DEFAULT_ANNOTATIONS = [
  {
    id: 'aorta',
    title_pulaar: 'Ɗadol Mawngol (Aorot)',
    title_fr: 'Aorte & Crosse aortique',
    title_en: 'Aorta & Aortic Arch',
    category: 'vessel',
    position: { x: 0.1, y: 1.85, z: 0.2 },
    description_pulaar: 'Ɗadol ɓurngol mawnude e ɓanndu aadee. Ngal yaltata ko e suudu ɓernde nano, ngal safata ƴiiƴam laaɓɗam keewɗam oksijen feewde e terɗe fof.',
    description_fr: 'La plus grande artère du corps humain. Elle émerge du ventricule gauche et distribue le sang oxygéné à l’ensemble de l’organisme via ses branches.',
    description_en: 'The largest artery in the human body. Originates from the left ventricle and pumps oxygen-rich blood to the entire body.',
    fun_fact_pulaar: 'Kala nde ɓernde fiifi, aorot ina ɓuttina ngam waawde neldude ƴiiƴam haa to koyɗe e hoore.',
    color: '#e63946',
    custom: false
  },
  {
    id: 'pulmonary_artery',
    title_pulaar: 'Ɗadol Ɓuuñcu (Artäär Pulmoneer)',
    title_fr: 'Tronc & Artères pulmonaires',
    title_en: 'Pulmonary Trunk & Arteries',
    category: 'vessel',
    position: { x: -0.45, y: 1.35, z: 0.8 },
    description_pulaar: 'Ɗadol ummotoongol e suudu ɓernde ñaamo. Ngal nawat ƴiiƴam tuunɗam (famɗuɗam oksijen) feewde e ɓuuñcuuji ɗiɗi ngam heɓde henndu laaɓndu.',
    description_fr: 'Artère partant du ventricule droit. Elle transporte le sang désoxygéné vers les deux poumons pour y être réoxygéné.',
    description_en: 'Artery leading from the right ventricle. Carries deoxygenated blood to both lungs for gas exchange.',
    fun_fact_pulaar: 'Ko kañum tan woni ɗadol artäär e ɓanndu nawaangol ƴiiƴam tuunɗam.',
    color: '#2b7fff',
    custom: false
  },
  {
    id: 'superior_vena_cava',
    title_pulaar: 'Ɗadol Hewtingol Dow (Kawaa Dow)',
    title_fr: 'Veine cave supérieure',
    title_en: 'Superior Vena Cava',
    category: 'vessel',
    position: { x: 0.9, y: 1.6, z: -0.1 },
    description_pulaar: 'Ɗadol mawngol addoowol ƴiiƴam tuunɗam ummoraade e hoore, daande, e juuɗe feewde e hewtirde ñaamo ɓernde.',
    description_fr: 'Grosse veine qui draine le sang veineux de la partie supérieure du corps (tête, cou, membres supérieurs) vers l’oreillette droite.',
    description_en: 'Large vein returning deoxygenated blood from the upper half of the body directly into the right atrium.',
    fun_fact_pulaar: 'Ngal alaa ombirɗe (valvules), ƴiiƴam ina jillondira rewrude e doole ɓuttigu.',
    color: '#1d4ed8',
    custom: false
  },
  {
    id: 'inferior_vena_cava',
    title_pulaar: 'Ɗadol Hewtingol Les (Kawaa Les)',
    title_fr: 'Veine cave inférieure',
    title_en: 'Inferior Vena Cava',
    category: 'vessel',
    position: { x: 0.85, y: -0.9, z: -0.5 },
    description_pulaar: 'Ɗadol mawngol ngol ƴettata ƴiiƴam ummoraade e reedu, koyɗe, e terɗe les ngam artirde ɗum e ɓernde.',
    description_fr: 'La plus grande veine du corps. Elle ramène le sang pauvre en oxygène des membres inférieurs et de l’abdomen vers l’oreillette droite.',
    description_en: 'The largest vein in the body, returning deoxygenated blood from lower extremities and abdomen to the right atrium.',
    fun_fact_pulaar: 'Ƴiiƴam reedu e koyɗe fof ko ɗoo rewata ngam heɓtinde laaɓal.',
    color: '#1e40af',
    custom: false
  },
  {
    id: 'right_atrium',
    title_pulaar: 'Hewtirde Ñaamo (Atriyom Ñaamo)',
    title_fr: 'Oreillette droite',
    title_en: 'Right Atrium',
    category: 'chamber',
    position: { x: 1.15, y: 0.5, z: 0.3 },
    description_pulaar: 'Suudu dow ñaamo ɓernde. Ndu heɓata ƴiiƴam tuunɗam ummoraade e ɗaɗi hewtingol dow e les ngam neldude ɗum e suudu les ñaamo.',
    description_fr: 'Cavité supérieure droite du cœur recevant le sang désoxygéné avant de le propulser vers le ventricule droit à travers la valve tricuspide.',
    description_en: 'Right upper chamber that receives deoxygenated blood from systemic circulation and pushes it into the right ventricle.',
    fun_fact_pulaar: 'Ko ɗoo nokku ɗo "sinus node" (moƴƴinirde dimmere ɓernde) woni, kañum fawata tekke fiifngo ngoo.',
    color: '#3b82f6',
    custom: false
  },
  {
    id: 'right_ventricle',
    title_pulaar: 'Suudu Ɓernde Ñaamo (Ventrikil Ñaamo)',
    title_fr: 'Ventricule droit',
    title_en: 'Right Ventricle',
    category: 'chamber',
    position: { x: 0.45, y: -0.4, z: 0.9 },
    description_pulaar: 'Suudu les ñaamo ɓernde. Ndu fiifata ƴiiƴam tuunɗam feewde e ɓuuñcuuji rewrude e ɗadol ɓuuñcu ngam heɓde oksijen.',
    description_fr: 'Cavité inférieure droite pompant le sang veineux vers les poumons à travers la valve pulmonaire.',
    description_en: 'Lower right chamber pumping deoxygenated blood under low pressure into the pulmonary circulation.',
    fun_fact_pulaar: 'Kokwol mayru ɓuri famɗude doole so yerondiraama e suudu nano, sabu ɓuuñcuuji ɓadii ɓernde.',
    color: '#0284c7',
    custom: false
  },
  {
    id: 'left_atrium',
    title_pulaar: 'Hewtirde Nano (Atriyom Nano)',
    title_fr: 'Oreillette gauche',
    title_en: 'Left Atrium',
    category: 'chamber',
    position: { x: -0.9, y: 0.7, z: -0.6 },
    description_pulaar: 'Suudu dow nano ɓernde. Ndu heɓata ƴiiƴam laaɓɗam keewɗam oksijen ummoraade e ɓuuñcuuji rewrude e ɗaɗi ɓuuñcu nai (4).',
    description_fr: 'Cavité supérieure gauche recevant le sang nouvellement oxygéné provenant des quatre veines pulmonaires.',
    description_en: 'Left upper chamber receiving fresh, oxygenated blood from the four pulmonary veins.',
    fun_fact_pulaar: 'Ndu fawaama e caggal ɓernde, ƴiiƴam laaɓɗam ina heewi ɗoon no feewi.',
    color: '#f87171',
    custom: false
  },
  {
    id: 'left_ventricle',
    title_pulaar: 'Suudu Ɓernde Nano (Ventrikil Nano)',
    title_fr: 'Ventricule gauche',
    title_en: 'Left Ventricle',
    category: 'chamber',
    position: { x: -0.55, y: -0.7, z: 0.5 },
    description_pulaar: 'Suudu ɓurndu yaajde e semmbiɗde e ɓernde. Ndu fiifata ƴiiƴam laaɓɗam feewde e ɗadol mawngol (aorta) ngam neldude ɗum e ɓalndu nduu fof.',
    description_fr: 'La chambre la plus puissante et musculaire du cœur. Elle propulse le sang oxygéné sous haute pression vers tout l’organisme.',
    description_en: 'The most muscular cardiac chamber. Pumps oxygenated blood through the aorta to meet metabolic demands of the whole body.',
    fun_fact_pulaar: 'Kokwol mayru ina mawni laabi tati so yerondiraama e suudu ñaamo sabu ina sokli semmbe mawnde.',
    color: '#dc2626',
    custom: false
  },
  {
    id: 'apex',
    title_pulaar: 'Seɓre Ɓernde (Hooɓre)',
    title_fr: 'Apex du cœur (Pointe)',
    title_en: 'Cardiac Apex',
    category: 'tissue',
    position: { x: -0.4, y: -1.75, z: 0.3 },
    description_pulaar: 'Cebal leswal ɓernde ngal woni ko e bannge nano, ngal tiindi les e yeeso. Ko kañum ɓuri memde wirgo ɓaawo nde ɓernde fiifi.',
    description_fr: 'Extrémité inférieure conique du cœur, formée par la pointe du ventricule gauche. Elle bat contre la paroi thoracique.',
    description_en: 'The rounded conical lower tip of the heart, oriented downwards, forwards, and to the left.',
    fun_fact_pulaar: 'So a fawii junngo maa e ɓernde maa, ko ɗoo a ɓuri heɗaade fiifngo ɓernde ngoo.',
    color: '#b91c1c',
    custom: false
  },
  {
    id: 'coronary_vessels',
    title_pulaar: 'Ɗaɗi Koroner (Ɗaɗi Ñamminooje)',
    title_fr: 'Artères & Veines coronaires',
    title_en: 'Coronary Arteries & Veins',
    category: 'vessel',
    position: { x: -0.1, y: -0.3, z: 1.05 },
    description_pulaar: 'Ɗaɗi cankotooɗi e ɓernde ndee fof ngam addande teewu ɓernde ƴiiƴam, oksijen, e ñamri mbele ɓernde woto ronkude gollude.',
    description_fr: 'Réseau vasculaire artériel et veineux qui irrigue et nourrit directement le muscle cardiaque (myocarde).',
    description_en: 'The network of arteries and veins supplying oxygen and metabolic nutrients directly to the myocardial muscle.',
    fun_fact_pulaar: 'So ɗadol koroner sukkiima, ɗum ina waawi addude rafi mawɗo biyeteeɗo "crise cardiaque".',
    color: '#ef4444',
    custom: false
  },
  {
    id: 'mitral_valve',
    title_pulaar: 'Walf Mitaral (Ombirgal Nano)',
    title_fr: 'Valvule mitrale (Bicuspide)',
    title_en: 'Mitral Valve (Bicuspid)',
    category: 'valve',
    position: { x: -0.4, y: 0.05, z: -0.05 },
    description_pulaar: 'Damgal ɓernde jogiingal taƴe ɗiɗi, ngal woni ko hakkunde hewtirde nano e suudu les nano. Ngal haɗata ƴiiƴam ruttitaade.',
    description_fr: 'Valve bicuspide séparant l’oreillette gauche du ventricule gauche, empêchant le reflux sanguin pendant la systole.',
    description_en: 'Dual-flap valve between the left atrium and left ventricle that prevents backflow during ventricular contraction.',
    fun_fact_pulaar: 'Innde mayre ummii ko e hufneere almudɓe (mitre) sabu nanndiinde e taƴe ɗiɗi.',
    color: '#fb923c',
    custom: false
  },
  {
    id: 'tricuspid_valve',
    title_pulaar: 'Walf Tirikuspid (Ombirgal Ñaamo)',
    title_fr: 'Valvule tricuspide',
    title_en: 'Tricuspid Valve',
    category: 'valve',
    position: { x: 0.5, y: -0.05, z: 0.25 },
    description_pulaar: 'Damgal jogiingal taƴe tati hakkunde hewtirde ñaamo e suudu les ñaamo ngam reende dogdu ƴiiƴam.',
    description_fr: 'Valve à trois cuspides située entre l’oreillette droite et le ventricule droit.',
    description_en: 'Three-leaflet valve separating the right atrium from the right ventricle.',
    fun_fact_pulaar: 'Taƴe mayre tati ɗee ina ɓooma e ɓoggi tokoosi biyeteeɗi "chordae tendineae".',
    color: '#f59e0b',
    custom: false
  },
  {
    id: 'myocardium',
    title_pulaar: 'Teewu Ɓernde (Miyokaard)',
    title_fr: 'Myocarde (Muscle cardiaque)',
    title_en: 'Myocardium',
    category: 'tissue',
    position: { x: -1.0, y: -0.85, z: 0.2 },
    description_pulaar: 'Teewu jikkuwal ɓernde gollanewal fiifde e huutoraade semmbe. Ngu golloyat ko e dow yamiroore nguurndam tawa ko e ŋari hoyre.',
    description_fr: 'La couche musculaire épaisse constituant la majorité de la masse cardiaque, responsable de la contraction contractile involontaire.',
    description_en: 'The thick muscular middle layer of the heart wall responsible for continuous rhythmic contraction.',
    fun_fact_pulaar: 'Teewu ɓernde soomataa, ngu fiifata ko hedde laabi 100 000 kala ñalawma tawa ngu fooftaaki.',
    color: '#991b1b',
    custom: false
  },
  {
    id: 'septum',
    title_pulaar: 'Kattirgal Ɓernde (Ceŋol)',
    title_fr: 'Septum interventriculaire',
    title_en: 'Interventricular Septum',
    category: 'tissue',
    position: { x: -0.05, y: -0.6, z: 0.15 },
    description_pulaar: 'Kokwol teewu cendoowol suudu nano e suudu ñaamo, mbele ƴiiƴam laaɓɗam e ƴiiƴam tuunɗam jillondirtaa.',
    description_fr: 'Paroi musculaire épaisse séparant hermétiquement le ventricule droit du ventricule gauche.',
    description_en: 'Muscular dividing wall separating the right and left ventricles, preventing oxygenated and deoxygenated blood mixing.',
    fun_fact_pulaar: 'So kattirgal ngal ina waɗi wuddere e cukalel, ɗum noddirtee ko VSD (Ventricular Septal Defect).',
    color: '#7f1d1d',
    custom: false
  },
  {
    id: 'pulmonary_veins',
    title_pulaar: 'Ɗaɗi Ɓuuñcu (Wenne Pulmoneer)',
    title_fr: 'Quatre veines pulmonaires',
    title_en: 'Pulmonary Veins',
    category: 'vessel',
    position: { x: -0.85, y: 0.95, z: -0.8 },
    description_pulaar: 'Ɗaɗi nai (4) ngaddooji ƴiiƴam keewɗam oksijen ummoraade e ɓuuñcuuji ɗiɗi feewde e hewtirde nano ɓernde.',
    description_fr: 'Quatre veines transportant le sang riche en oxygène depuis les poumons vers l’oreillette gauche.',
    description_en: 'Four vessels carrying oxygen-rich blood from both lungs back into the left atrium of the heart.',
    fun_fact_pulaar: 'Ɗe ngoni ɗaɗi wenne tan e ɓanndu nawrooji ƴiiƴam laaɓɗam keewɗam oksijen.',
    color: '#ef4444',
    custom: false
  }
];

const STORAGE_KEY = 'bernde_3d_pulaar_annotations_v1';

export class AnnotationStore {
  constructor() {
    this.annotations = [];
    this.selectedId = null;
    this.listeners = new Set();
    this.load();
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.annotations = this.sanitizeList(parsed);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Could not read localStorage for annotations:", e);
    }
    // Default clone
    this.annotations = JSON.parse(JSON.stringify(DEFAULT_ANNOTATIONS));
    this.save();
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.annotations));
      }
    } catch (e) {
      console.warn("Could not save annotations to localStorage:", e);
    }
    this.notify();
  }

  sanitizeList(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter(item => item && (item.title_pulaar || item.title_fr))
      .map((item, idx) => {
        const posX = Number(item.position?.x);
        const posY = Number(item.position?.y);
        const posZ = Number(item.position?.z);

        return {
          id: item.id || `custom_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}`,
          title_pulaar: String(item.title_pulaar || item.title_fr || 'Ñoŋal Keso').trim(),
          title_fr: String(item.title_fr || '').trim(),
          title_en: String(item.title_en || '').trim(),
          category: CATEGORIES[item.category] ? item.category : 'other',
          position: {
            x: Number.isFinite(posX) ? posX : 0,
            y: Number.isFinite(posY) ? posY : 0,
            z: Number.isFinite(posZ) ? posZ : 0
          },
          description_pulaar: String(item.description_pulaar || '').trim(),
          description_fr: String(item.description_fr || '').trim(),
          description_en: String(item.description_en || '').trim(),
          fun_fact_pulaar: String(item.fun_fact_pulaar || '').trim(),
          color: (item.color && typeof item.color === 'string') ? item.color : '#e63946',
          custom: Boolean(item.custom !== false)
        };
      });
  }

  getAll() {
    return [...this.annotations];
  }

  getById(id) {
    return this.annotations.find(a => a.id === id) || null;
  }

  add(annotationData) {
    const id = annotationData.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const posX = Number(annotationData.position?.x);
    const posY = Number(annotationData.position?.y);
    const posZ = Number(annotationData.position?.z);

    const newAnnotation = {
      id,
      title_pulaar: String(annotationData.title_pulaar || 'Ñoŋal Keso').trim(),
      title_fr: String(annotationData.title_fr || '').trim(),
      title_en: String(annotationData.title_en || '').trim(),
      category: CATEGORIES[annotationData.category] ? annotationData.category : 'other',
      position: {
        x: Number.isFinite(posX) ? posX : 0,
        y: Number.isFinite(posY) ? posY : 0,
        z: Number.isFinite(posZ) ? posZ : 0
      },
      description_pulaar: String(annotationData.description_pulaar || '').trim(),
      description_fr: String(annotationData.description_fr || '').trim(),
      description_en: String(annotationData.description_en || '').trim(),
      fun_fact_pulaar: String(annotationData.fun_fact_pulaar || '').trim(),
      color: annotationData.color || '#2a9d8f',
      custom: true,
      createdAt: new Date().toISOString()
    };

    this.annotations.push(newAnnotation);
    this.save();
    return newAnnotation;
  }

  update(id, partial) {
    const idx = this.annotations.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const current = this.annotations[idx];
    const updated = {
      ...current,
      ...partial,
      id // preserve ID
    };

    if (partial.position) {
      const px = Number(partial.position.x);
      const py = Number(partial.position.y);
      const pz = Number(partial.position.z);
      updated.position = {
        x: Number.isFinite(px) ? px : current.position.x,
        y: Number.isFinite(py) ? py : current.position.y,
        z: Number.isFinite(pz) ? pz : current.position.z
      };
    }

    this.annotations[idx] = updated;
    this.save();
    return this.annotations[idx];
  }

  remove(id) {
    const idx = this.annotations.findIndex(a => a.id === id);
    if (idx === -1) return false;

    this.annotations.splice(idx, 1);
    if (this.selectedId === id) {
      this.selectedId = null;
    }
    this.save();
    return true;
  }

  resetToDefault() {
    this.annotations = JSON.parse(JSON.stringify(DEFAULT_ANNOTATIONS));
    this.selectedId = null;
    this.save();
  }

  exportJSON() {
    return JSON.stringify(this.annotations, null, 2);
  }

  importJSON(jsonString) {
    try {
      const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      if (!Array.isArray(data)) throw new Error("JSON must be an array of annotations");

      const valid = this.sanitizeList(data);
      if (valid.length === 0) throw new Error("No valid annotations found in file");

      this.annotations = valid;
      this.selectedId = null;
      this.save();
      return true;
    } catch (e) {
      console.error("Failed to import annotations:", e);
      throw e;
    }
  }

  select(id) {
    this.selectedId = id;
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.annotations, this.selectedId);
      } catch (err) {
        console.error("Listener error:", err);
      }
    }
  }
}

export const annotationStore = new AnnotationStore();
