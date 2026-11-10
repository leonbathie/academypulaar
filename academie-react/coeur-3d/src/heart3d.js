/**
 * 3D Anatomical Heart Visualization Engine (Three.js)
 * High-fidelity anatomical model, physiological heartbeat cycle,
 * blood flow particle simulation, cross-section clipping, and 3D annotation pins.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { heartAudio } from './audio.js';

export class HeartScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth;
    this.height = canvasContainer.clientHeight;

    this.bpm = 72;
    this.isPlaying = true;
    this.renderMode = 'realistic'; // 'realistic' | 'colored' | 'xray' | 'wireframe'
    this.isCrossSection = false;
    this.showBloodFlow = true;
    this.showAnnotations = true;

    this.heartGroup = new THREE.Group();
    this.pinsGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();

    this.meshParts = new Map(); // id -> mesh or group
    this.pinMeshes = new Map(); // id -> pin 3D object

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredPart = null;
    this.hoveredPin = null;
    this.isAddPinMode = false;

    // Callbacks
    this.onSelectPin = null;
    this.onAddPinCoords = null;
    this.onHoverPart = null;
    this.onAddPinModeChange = null;

    // Cardiac cycle timing
    this.clock = new THREE.Clock();
    this.cycleTime = 0;
    this.lastSoundBeat = 0;

    // Camera target animation
    this.camTarget = {
      pos: new THREE.Vector3(0, 0.2, 5.2),
      look: new THREE.Vector3(0, 0, 0),
      isAnimating: false,
      progress: 0
    };
    this.camStart = {
      pos: new THREE.Vector3(0, 0.2, 5.2),
      look: new THREE.Vector3(0, 0, 0)
    };

    this.init();
    this.createHeartModel();
    this.setupBloodParticles();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b12);
    this.scene.fog = new THREE.FogExp2(0x070b12, 0.045);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.2, 5.2);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 1.8;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting
    this.setupLighting();

    // 6. Clipping Plane for cross section
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.25);

    // 7. Add root groups
    this.scene.add(this.heartGroup);
    this.scene.add(this.pinsGroup);
    this.scene.add(this.particlesGroup);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x2d3748, 1.2);
    this.scene.add(ambientLight);

    // Key directional light (surgical/studio warm white)
    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    this.keyLight.position.set(4, 5, 4);
    this.scene.add(this.keyLight);

    // Fill directional light (soft cool blue)
    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    this.fillLight.position.set(-4, 2, -3);
    this.scene.add(this.fillLight);

    // Rim light (vibrant edge definition)
    this.rimLight = new THREE.DirectionalLight(0xf43f5e, 1.6);
    this.rimLight.position.set(0, -5, -4);
    this.scene.add(this.rimLight);

    // Central subtle point light inside the cavity for internal glow
    this.cavityLight = new THREE.PointLight(0xff4d6d, 1.2, 4);
    this.cavityLight.position.set(0, 0, 0);
    this.heartGroup.add(this.cavityLight);
  }

  /**
   * Procedurally generates a realistic muscle bump texture
   */
  createMuscleTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base flesh tone
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    // Fibrous muscle striations
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 15 + Math.random() * 45;
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4;
      const alpha = 0.04 + Math.random() * 0.12;

      ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * Builds the anatomical components of the human heart
   */
  createHeartModel() {
    this.bumpTexture = this.createMuscleTexture();

    // Material Library with discrete chamber materials
    this.materials = {
      // Realistic PBR Chambers & Muscle
      leftVentricle: new THREE.MeshStandardMaterial({
        color: 0x931828,
        roughness: 0.38,
        metalness: 0.12,
        bumpMap: this.bumpTexture,
        bumpScale: 0.04
      }),
      rightVentricle: new THREE.MeshStandardMaterial({
        color: 0x931828,
        roughness: 0.38,
        metalness: 0.12,
        bumpMap: this.bumpTexture,
        bumpScale: 0.04
      }),
      leftAtrium: new THREE.MeshStandardMaterial({
        color: 0x931828,
        roughness: 0.38,
        metalness: 0.12,
        bumpMap: this.bumpTexture,
        bumpScale: 0.03
      }),
      rightAtrium: new THREE.MeshStandardMaterial({
        color: 0x931828,
        roughness: 0.38,
        metalness: 0.12,
        bumpMap: this.bumpTexture,
        bumpScale: 0.03
      }),
      septum: new THREE.MeshStandardMaterial({
        color: 0x821c2a,
        roughness: 0.42,
        metalness: 0.10,
        bumpMap: this.bumpTexture,
        bumpScale: 0.03
      }),
      aorta: new THREE.MeshStandardMaterial({
        color: 0xc81e2b,
        roughness: 0.28,
        metalness: 0.15
      }),
      pulmonaryArtery: new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: 0.32,
        metalness: 0.12
      }),
      venaCava: new THREE.MeshStandardMaterial({
        color: 0x1d4ed8,
        roughness: 0.32,
        metalness: 0.12
      }),
      pulmonaryVeins: new THREE.MeshStandardMaterial({
        color: 0xd92d3c,
        roughness: 0.3,
        metalness: 0.12
      }),
      coronaryArtery: new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.2,
        metalness: 0.25,
        emissive: 0x5a0a10,
        emissiveIntensity: 0.2
      }),
      coronaryVein: new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.2,
        metalness: 0.25,
        emissive: 0x0a2050,
        emissiveIntensity: 0.2
      }),
      fatTissue: new THREE.MeshStandardMaterial({
        color: 0xd4b26f,
        roughness: 0.7,
        metalness: 0.05
      }),
      valves: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.5,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      }),
      interior: new THREE.MeshStandardMaterial({
        color: 0x6e0e1a,
        roughness: 0.45,
        metalness: 0.08,
        side: THREE.BackSide
      })
    };
    this.materials.myocardium = this.materials.leftVentricle;

    // 1. Left Ventricle (Suudu nano & Apex)
    this.createLeftVentricle();

    // 2. Right Ventricle (Suudu ñaamo)
    this.createRightVentricle();

    // 3. Atria (Hewtirde nano & Hewtirde ñaamo)
    this.createAtria();

    // 4. Aorta & Aortic Arch with 3 branches (Ɗadol mawngol)
    this.createAorta();

    // 5. Pulmonary Trunk & Arteries (Ɗadol ɓuuñcu)
    this.createPulmonaryArteries();

    // 6. Vena Cava (Superior & Inferior)
    this.createVenaCava();

    // 7. Pulmonary Veins (Ɗaɗi ɓuuñcu)
    this.createPulmonaryVeins();

    // 8. Coronary Arteries & Veins (Ɗaɗi koroner)
    this.createCoronarySystem();

    // 9. Internal Valves & Septum
    this.createInternalStructures();

    // Center and tilt the heart anatomically (human heart sits with apex pointing downward, forward, and to the left)
    this.heartGroup.rotation.x = 0.15;
    this.heartGroup.rotation.y = -0.15;
    this.heartGroup.rotation.z = -0.12;
    this.heartGroup.position.set(0, 0.1, 0);
  }

  createLeftVentricle() {
    const group = new THREE.Group();
    group.name = 'left_ventricle';

    // Outer thick muscular conical body
    const geom = new THREE.SphereGeometry(1.05, 48, 48);
    const pos = geom.attributes.position;

    // Sculpt into organic left ventricle shape with pointed apex
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Elongate downwards
      if (y < 0) {
        y *= 1.65;
        // Taper towards apex
        const taper = 1.0 + y * 0.35;
        x *= Math.max(0.18, taper);
        z *= Math.max(0.18, taper);
        // Curve apex towards anterior left
        x -= Math.pow(Math.abs(y), 1.3) * 0.08;
        z += Math.pow(Math.abs(y), 1.2) * 0.06;
      } else {
        y *= 0.85;
      }

      // Interventricular groove indentation on the right side
      if (x > 0.1 && z > 0) {
        x -= Math.sin(y * 2) * 0.08;
      }

      pos.setXYZ(i, x, y, z);
    }
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, this.materials.leftVentricle);
    mesh.position.set(-0.35, -0.4, 0.05);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id: 'left_ventricle', title: 'Suudu Ɓernde Nano' };

    group.add(mesh);
    this.heartGroup.add(group);
    this.meshParts.set('left_ventricle', group);
  }

  createRightVentricle() {
    const group = new THREE.Group();
    group.name = 'right_ventricle';

    // Crescent-like pocket wrapping the anterolateral right side
    const geom = new THREE.SphereGeometry(0.85, 40, 40);
    const pos = geom.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      if (y < 0) {
        y *= 1.4;
        const taper = 1.0 + y * 0.3;
        x *= Math.max(0.25, taper);
        z *= Math.max(0.25, taper);
      }
      // Crescent flattening on the left where it meets the septum
      if (x < 0) {
        x *= 0.6;
      }
      // Bulge anteriorly
      if (z > 0) {
        z *= 1.25;
      }

      pos.setXYZ(i, x, y, z);
    }
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(geom, this.materials.rightVentricle);
    mesh.position.set(0.42, -0.25, 0.35);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id: 'right_ventricle', title: 'Suudu Ɓernde Ñaamo' };

    group.add(mesh);
    this.heartGroup.add(group);
    this.meshParts.set('right_ventricle', group);
  }

  createAtria() {
    // 1. Right Atrium (Hewtirde Ñaamo)
    const raGroup = new THREE.Group();
    raGroup.name = 'right_atrium';

    const raGeom = new THREE.SphereGeometry(0.72, 36, 36);
    raGeom.scale(0.85, 1.15, 0.85);
    const raMesh = new THREE.Mesh(raGeom, this.materials.rightAtrium);
    raMesh.position.set(0.95, 0.55, 0.1);
    raMesh.userData = { id: 'right_atrium', title: 'Hewtirde Ñaamo' };
    raGroup.add(raMesh);

    // Right Auricle (appendage reaching over aorta)
    const raAuricleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, 0.7, 0.4),
      new THREE.Vector3(0.5, 0.65, 0.7),
      new THREE.Vector3(0.2, 0.5, 0.75)
    ]);
    const raAuricleGeom = new THREE.TubeGeometry(raAuricleCurve, 16, 0.18, 12, false);
    const raAuricleMesh = new THREE.Mesh(raAuricleGeom, this.materials.rightAtrium);
    raAuricleMesh.userData = { id: 'right_atrium', title: 'Hewtirde Ñaamo' };
    raGroup.add(raAuricleMesh);

    this.heartGroup.add(raGroup);
    this.meshParts.set('right_atrium', raGroup);

    // 2. Left Atrium (Hewtirde Nano)
    const laGroup = new THREE.Group();
    laGroup.name = 'left_atrium';

    const laGeom = new THREE.SphereGeometry(0.7, 36, 36);
    laGeom.scale(0.95, 1.05, 0.8);
    const laMesh = new THREE.Mesh(laGeom, this.materials.leftAtrium);
    laMesh.position.set(-0.75, 0.65, -0.45);
    laMesh.userData = { id: 'left_atrium', title: 'Hewtirde Nano' };
    laGroup.add(laMesh);

    // Left Auricle (reaching anteriorly around pulmonary artery)
    const laAuricleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.75, -0.2),
      new THREE.Vector3(-0.85, 0.6, 0.25),
      new THREE.Vector3(-0.7, 0.35, 0.55)
    ]);
    const laAuricleGeom = new THREE.TubeGeometry(laAuricleCurve, 16, 0.16, 12, false);
    const laAuricleMesh = new THREE.Mesh(laAuricleGeom, this.materials.leftAtrium);
    laAuricleMesh.userData = { id: 'left_atrium', title: 'Hewtirde Nano' };
    laGroup.add(laAuricleMesh);

    this.heartGroup.add(laGroup);
    this.meshParts.set('left_atrium', laGroup);
  }

  createAorta() {
    const group = new THREE.Group();
    group.name = 'aorta';

    // Aortic Arch Main Curve
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.08, 0.35, 0.2),   // Root at left ventricle base
      new THREE.Vector3(0.12, 0.95, 0.32),   // Ascending aorta
      new THREE.Vector3(0.2, 1.55, 0.25),    // Arch apex
      new THREE.Vector3(0.0, 1.85, 0.0),     // Top summit of arch
      new THREE.Vector3(-0.35, 1.6, -0.35),  // Transverse arch
      new THREE.Vector3(-0.55, 0.9, -0.65),  // Descending aorta
      new THREE.Vector3(-0.58, -0.4, -0.7)   // Thoracic aorta
    ]);

    const aortaGeom = new THREE.TubeGeometry(aortaCurve, 48, 0.29, 24, false);
    const aortaMesh = new THREE.Mesh(aortaGeom, this.materials.aorta);
    aortaMesh.castShadow = true;
    aortaMesh.userData = { id: 'aorta', title: 'Ɗadol Mawngol (Aorot)' };
    group.add(aortaMesh);

    // 3 Head & Neck Arterial Branches emerging from the Aortic Arch
    // 1. Truncus Brachiocephalicus
    const branch1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.15, 1.75, 0.15),
      new THREE.Vector3(0.35, 2.15, 0.22),
      new THREE.Vector3(0.48, 2.45, 0.28)
    ]);
    const branch1 = new THREE.Mesh(
      new THREE.TubeGeometry(branch1Curve, 16, 0.11, 14, false),
      this.materials.aorta
    );
    branch1.userData = { id: 'aorta', title: 'Ɗadol Mawngol (Aorot)' };
    group.add(branch1);

    // 2. Left Common Carotid Artery (Arteria carotis communis sinistra)
    const branch2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 1.84, 0.05),
      new THREE.Vector3(0.08, 2.22, 0.12),
      new THREE.Vector3(0.12, 2.52, 0.15)
    ]);
    const branch2 = new THREE.Mesh(
      new THREE.TubeGeometry(branch2Curve, 16, 0.085, 14, false),
      this.materials.aorta
    );
    branch2.userData = { id: 'aorta', title: 'Ɗadol Mawngol (Aorot)' };
    group.add(branch2);

    // 3. Left Subclavian Artery (Arteria subclavia sinistra)
    const branch3Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 1.76, -0.12),
      new THREE.Vector3(-0.22, 2.18, -0.05),
      new THREE.Vector3(-0.25, 2.48, 0.0)
    ]);
    const branch3 = new THREE.Mesh(
      new THREE.TubeGeometry(branch3Curve, 16, 0.085, 14, false),
      this.materials.aorta
    );
    branch3.userData = { id: 'aorta', title: 'Ɗadol Mawngol (Aorot)' };
    group.add(branch3);

    this.heartGroup.add(group);
    this.meshParts.set('aorta', group);
  }

  createPulmonaryArteries() {
    const group = new THREE.Group();
    group.name = 'pulmonary_artery';

    // Pulmonary Trunk originating from right ventricle infundibulum
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.25, 0.35, 0.65),
      new THREE.Vector3(0.05, 0.85, 0.65),
      new THREE.Vector3(-0.2, 1.25, 0.45),
      new THREE.Vector3(-0.35, 1.4, 0.1)
    ]);
    const trunkGeom = new THREE.TubeGeometry(trunkCurve, 28, 0.26, 20, false);
    const trunkMesh = new THREE.Mesh(trunkGeom, this.materials.pulmonaryArtery);
    trunkMesh.userData = { id: 'pulmonary_artery', title: 'Ɗadol Ɓuuñcu' };
    group.add(trunkMesh);

    // Left Pulmonary Artery branching to the left lung
    const leftBranchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 1.4, 0.1),
      new THREE.Vector3(-0.75, 1.45, -0.05),
      new THREE.Vector3(-1.25, 1.4, -0.2)
    ]);
    const leftBranch = new THREE.Mesh(
      new THREE.TubeGeometry(leftBranchCurve, 16, 0.18, 16, false),
      this.materials.pulmonaryArtery
    );
    leftBranch.userData = { id: 'pulmonary_artery', title: 'Ɗadol Ɓuuñcu' };
    group.add(leftBranch);

    // Right Pulmonary Artery crossing under arch and behind ascending aorta to right lung
    const rightBranchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.35, 1.4, 0.1),
      new THREE.Vector3(0.1, 1.35, -0.15),
      new THREE.Vector3(0.65, 1.25, -0.3),
      new THREE.Vector3(1.25, 1.15, -0.38)
    ]);
    const rightBranch = new THREE.Mesh(
      new THREE.TubeGeometry(rightBranchCurve, 20, 0.18, 16, false),
      this.materials.pulmonaryArtery
    );
    rightBranch.userData = { id: 'pulmonary_artery', title: 'Ɗadol Ɓuuñcu' };
    group.add(rightBranch);

    this.heartGroup.add(group);
    this.meshParts.set('pulmonary_artery', group);
  }

  createVenaCava() {
    const group = new THREE.Group();
    group.name = 'vena_cava';

    // 1. Superior Vena Cava (SVC) entering upper right atrium
    const svcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.9, 0.85, 0.05),
      new THREE.Vector3(0.92, 1.5, 0.02),
      new THREE.Vector3(0.95, 2.1, -0.05)
    ]);
    const svcGeom = new THREE.TubeGeometry(svcCurve, 18, 0.24, 18, false);
    const svcMesh = new THREE.Mesh(svcGeom, this.materials.venaCava);
    svcMesh.userData = { id: 'superior_vena_cava', title: 'Ɗadol Hewtingol Dow' };
    group.add(svcMesh);

    // 2. Inferior Vena Cava (IVC) entering lower right atrium
    const ivcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.88, 0.25, -0.2),
      new THREE.Vector3(0.85, -0.45, -0.4),
      new THREE.Vector3(0.82, -1.05, -0.55)
    ]);
    const ivcGeom = new THREE.TubeGeometry(ivcCurve, 18, 0.25, 18, false);
    const ivcMesh = new THREE.Mesh(ivcGeom, this.materials.venaCava);
    ivcMesh.userData = { id: 'inferior_vena_cava', title: 'Ɗadol Hewtingol Les' };
    group.add(ivcMesh);

    this.heartGroup.add(group);
    this.meshParts.set('superior_vena_cava', svcMesh);
    this.meshParts.set('inferior_vena_cava', ivcMesh);
  }

  createPulmonaryVeins() {
    const group = new THREE.Group();
    group.name = 'pulmonary_veins';

    // Four pulmonary veins entering the posterior left atrium
    const positions = [
      // Left Superior & Inferior
      [new THREE.Vector3(-0.95, 0.85, -0.55), new THREE.Vector3(-1.3, 0.95, -0.65)],
      [new THREE.Vector3(-0.95, 0.55, -0.65), new THREE.Vector3(-1.3, 0.45, -0.75)],
      // Right Superior & Inferior
      [new THREE.Vector3(-0.35, 0.85, -0.75), new THREE.Vector3(-0.05, 0.9, -0.85)],
      [new THREE.Vector3(-0.35, 0.55, -0.85), new THREE.Vector3(-0.05, 0.5, -0.95)]
    ];

    positions.forEach((pts, idx) => {
      const curve = new THREE.CatmullRomCurve3(pts);
      const geom = new THREE.TubeGeometry(curve, 10, 0.12, 14, false);
      const mesh = new THREE.Mesh(geom, this.materials.pulmonaryVeins);
      mesh.userData = { id: 'pulmonary_veins', title: 'Ɗaɗi Ɓuuñcu' };
      group.add(mesh);
    });

    this.heartGroup.add(group);
    this.meshParts.set('pulmonary_veins', group);
  }

  createCoronarySystem() {
    const group = new THREE.Group();
    group.name = 'coronary_vessels';

    // 1. Left Anterior Descending Artery (LAD / Ɗadol koroner yeesowal)
    const ladCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.45, 0.82),
      new THREE.Vector3(0.02, 0.15, 0.95),
      new THREE.Vector3(-0.05, -0.3, 0.98),
      new THREE.Vector3(-0.15, -0.75, 0.88),
      new THREE.Vector3(-0.25, -1.2, 0.65),
      new THREE.Vector3(-0.35, -1.6, 0.35) // reaching towards apex
    ]);
    const ladMesh = new THREE.Mesh(
      new THREE.TubeGeometry(ladCurve, 32, 0.045, 12, false),
      this.materials.coronaryArtery
    );
    ladMesh.userData = { id: 'coronary_vessels', title: 'Ɗaɗi Koroner (LAD)' };
    group.add(ladMesh);

    // Diagonal branch 1
    const diag1Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.05, -0.3, 0.98),
      new THREE.Vector3(-0.35, -0.5, 0.85),
      new THREE.Vector3(-0.65, -0.65, 0.6)
    ]);
    const diag1Mesh = new THREE.Mesh(new THREE.TubeGeometry(diag1Curve, 12, 0.03, 10, false), this.materials.coronaryArtery);
    diag1Mesh.userData = { id: 'coronary_vessels', title: 'Ɗaɗi Koroner' };
    group.add(diag1Mesh);

    // Diagonal branch 2
    const diag2Curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, -0.75, 0.88),
      new THREE.Vector3(-0.45, -0.95, 0.72),
      new THREE.Vector3(-0.6, -1.1, 0.5)
    ]);
    const diag2Mesh = new THREE.Mesh(new THREE.TubeGeometry(diag2Curve, 12, 0.025, 10, false), this.materials.coronaryArtery);
    diag2Mesh.userData = { id: 'coronary_vessels', title: 'Ɗaɗi Koroner' };
    group.add(diag2Mesh);

    // 2. Right Coronary Artery (RCA) curving in right atrioventricular sulcus
    const rcaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.35, 0.45, 0.65),
      new THREE.Vector3(0.65, 0.25, 0.68),
      new THREE.Vector3(0.85, -0.15, 0.55),
      new THREE.Vector3(0.9, -0.55, 0.25),
      new THREE.Vector3(0.75, -0.85, -0.15)
    ]);
    const rcaMesh = new THREE.Mesh(
      new THREE.TubeGeometry(rcaCurve, 30, 0.045, 12, false),
      this.materials.coronaryArtery
    );
    rcaMesh.userData = { id: 'coronary_vessels', title: 'Ɗaɗi Koroner (RCA)' };
    group.add(rcaMesh);

    // Marginal branch
    const rcaMarginalCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, -0.15, 0.55),
      new THREE.Vector3(0.7, -0.55, 0.75),
      new THREE.Vector3(0.45, -0.9, 0.78)
    ]);
    const rcaMargMesh = new THREE.Mesh(new THREE.TubeGeometry(rcaMarginalCurve, 14, 0.03, 10, false), this.materials.coronaryArtery);
    rcaMargMesh.userData = { id: 'coronary_vessels', title: 'Ɗaɗi Koroner' };
    group.add(rcaMargMesh);

    // 3. Great Cardiac Vein (Ɗadol ƴiiƴam mawngol) running alongside LAD
    const veinCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, -1.45, 0.42),
      new THREE.Vector3(-0.2, -1.05, 0.72),
      new THREE.Vector3(-0.1, -0.55, 0.92),
      new THREE.Vector3(-0.02, 0.0, 0.92),
      new THREE.Vector3(-0.25, 0.35, 0.72),
      new THREE.Vector3(-0.55, 0.45, 0.35),
      new THREE.Vector3(-0.8, 0.3, -0.2) // into coronary sinus
    ]);
    const veinMesh = new THREE.Mesh(
      new THREE.TubeGeometry(veinCurve, 32, 0.04, 12, false),
      this.materials.coronaryVein
    );
    veinMesh.userData = { id: 'coronary_vessels', title: 'Ɗadol Ƴiiƴam Koroner (Wenne)' };
    group.add(veinMesh);

    // Epicardial adipose tissue (yellowish fat cushions in the grooves)
    const fatGeom = new THREE.SphereGeometry(0.2, 12, 12);
    fatGeom.scale(1.2, 0.6, 0.8);
    const fatMesh1 = new THREE.Mesh(fatGeom, this.materials.fatTissue);
    fatMesh1.position.set(0.1, 0.25, 0.85);
    fatMesh1.userData = { id: 'tissue', title: 'Beloore Ɓernde (Tissu Adipeux)' };
    group.add(fatMesh1);

    const fatMesh2 = new THREE.Mesh(fatGeom, this.materials.fatTissue);
    fatMesh2.position.set(0.55, 0.15, 0.68);
    fatMesh2.userData = { id: 'tissue', title: 'Beloore Ɓernde (Tissu Adipeux)' };
    group.add(fatMesh2);

    this.heartGroup.add(group);
    this.meshParts.set('coronary_vessels', group);
  }

  createInternalStructures() {
    this.internalGroup = new THREE.Group();
    this.internalGroup.name = 'internal_structures';
    this.internalGroup.visible = false; // toggled in cross-section view

    // 1. Interventricular Septum (Kattirgal ɓernde)
    const septumGeom = new THREE.BoxGeometry(0.22, 1.4, 0.95);
    const septumMesh = new THREE.Mesh(septumGeom, this.materials.septum);
    septumMesh.position.set(-0.05, -0.55, 0.15);
    septumMesh.rotation.y = 0.2;
    septumMesh.userData = { id: 'septum', title: 'Kattirgal Ɓernde (Ceŋol)' };
    this.internalGroup.add(septumMesh);

    // 2. Mitral Valve (Walf Mitaral / Bicuspid)
    const mitralRing = new THREE.TorusGeometry(0.28, 0.03, 12, 24);
    const mitralMesh = new THREE.Mesh(mitralRing, this.materials.valves);
    mitralMesh.position.set(-0.4, 0.08, -0.05);
    mitralMesh.rotation.x = Math.PI / 2 + 0.2;
    mitralMesh.userData = { id: 'mitral_valve', title: 'Walf Mitaral (Ombirgal Nano)' };
    this.internalGroup.add(mitralMesh);

    // Mitral valve cusps
    const mitralCuspGeom = new THREE.CircleGeometry(0.26, 20);
    const mitralCusp = new THREE.Mesh(mitralCuspGeom, this.materials.valves);
    mitralCusp.position.set(-0.4, 0.06, -0.05);
    mitralCusp.rotation.x = Math.PI / 2 + 0.2;
    mitralCusp.userData = { id: 'mitral_valve', title: 'Walf Mitaral (Ombirgal Nano)' };
    this.internalGroup.add(mitralCusp);

    // Chordae Tendineae (fibrous cords)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = -0.4 + Math.cos(angle) * 0.22;
      const z1 = -0.05 + Math.sin(angle) * 0.22;
      const chordaCurve = new THREE.LineCurve3(
        new THREE.Vector3(x1, 0.06, z1),
        new THREE.Vector3(-0.45, -0.4, 0.0) // papillary muscle head
      );
      const chordaGeom = new THREE.TubeGeometry(chordaCurve, 6, 0.012, 6, false);
      const chorda = new THREE.Mesh(chordaGeom, this.materials.valves);
      chorda.userData = { id: 'mitral_valve', title: 'Walf Mitaral (Ombirgal Nano)' };
      this.internalGroup.add(chorda);
    }

    // 3. Tricuspid Valve (Walf Tirikuspid)
    const tricuspidRing = new THREE.TorusGeometry(0.32, 0.03, 12, 24);
    const tricuspidMesh = new THREE.Mesh(tricuspidRing, this.materials.valves);
    tricuspidMesh.position.set(0.48, -0.05, 0.28);
    tricuspidMesh.rotation.x = Math.PI / 2 - 0.15;
    tricuspidMesh.userData = { id: 'tricuspid_valve', title: 'Walf Tirikuspid (Ombirgal Ñaamo)' };
    this.internalGroup.add(tricuspidMesh);

    // Tricuspid cusps
    const tricuspidCuspGeom = new THREE.CircleGeometry(0.3, 20);
    const tricuspidCusp = new THREE.Mesh(tricuspidCuspGeom, this.materials.valves);
    tricuspidCusp.position.set(0.48, -0.07, 0.28);
    tricuspidCusp.rotation.x = Math.PI / 2 - 0.15;
    tricuspidCusp.userData = { id: 'tricuspid_valve', title: 'Walf Tirikuspid (Ombirgal Ñaamo)' };
    this.internalGroup.add(tricuspidCusp);

    // Tricuspid chordae
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const x1 = 0.48 + Math.cos(angle) * 0.25;
      const z1 = 0.28 + Math.sin(angle) * 0.25;
      const chordaCurve = new THREE.LineCurve3(
        new THREE.Vector3(x1, -0.07, z1),
        new THREE.Vector3(0.5, -0.45, 0.35)
      );
      const chordaGeom = new THREE.TubeGeometry(chordaCurve, 6, 0.012, 6, false);
      const chorda = new THREE.Mesh(chordaGeom, this.materials.valves);
      chorda.userData = { id: 'tricuspid_valve', title: 'Walf Tirikuspid (Ombirgal Ñaamo)' };
      this.internalGroup.add(chorda);
    }

    this.heartGroup.add(this.internalGroup);
    this.meshParts.set('mitral_valve', mitralMesh);
    this.meshParts.set('tricuspid_valve', tricuspidMesh);
    this.meshParts.set('septum', septumMesh);
  }

  /**
   * Animated Blood Particle Circulation Pathways
   */
  setupBloodParticles() {
    // 1. Oxygenated Blood Flow Path (Red): Pulm. Veins -> LA -> LV -> Aorta
    this.redCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.1, 0.8, -0.6),
      new THREE.Vector3(-0.75, 0.65, -0.45),
      new THREE.Vector3(-0.4, 0.08, -0.05),
      new THREE.Vector3(-0.45, -0.8, 0.1),
      new THREE.Vector3(-0.35, -1.4, 0.25), // apex
      new THREE.Vector3(-0.1, -0.6, 0.1),
      new THREE.Vector3(-0.08, 0.35, 0.2),
      new THREE.Vector3(0.12, 0.95, 0.32),
      new THREE.Vector3(0.0, 1.85, 0.0),
      new THREE.Vector3(-0.55, 0.9, -0.65)
    ]);

    // 2. Deoxygenated Blood Flow Path (Blue): SVC/IVC -> RA -> RV -> Pulm. Trunk -> Pulm. Arteries
    this.blueCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.95, 1.8, 0.0),
      new THREE.Vector3(0.95, 0.55, 0.1),
      new THREE.Vector3(0.48, -0.05, 0.28),
      new THREE.Vector3(0.45, -0.6, 0.5),
      new THREE.Vector3(0.25, 0.35, 0.65),
      new THREE.Vector3(-0.2, 1.25, 0.45),
      new THREE.Vector3(-0.75, 1.45, -0.05),
      new THREE.Vector3(-1.25, 1.4, -0.2)
    ]);

    const particleCount = 120;
    this.redParticleData = [];
    this.blueParticleData = [];

    // Red particles geometry & material
    const redGeom = new THREE.BufferGeometry();
    const redPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      this.redParticleData.push({ t, speed: 0.12 + Math.random() * 0.08 });
      const pt = this.redCurve.getPoint(t);
      redPositions[i * 3] = pt.x + (Math.random() - 0.5) * 0.08;
      redPositions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.08;
      redPositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.08;
    }
    redGeom.setAttribute('position', new THREE.BufferAttribute(redPositions, 3));

    const redMat = new THREE.PointsMaterial({
      color: 0xff3b53,
      size: 0.085,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    this.redParticles = new THREE.Points(redGeom, redMat);
    this.particlesGroup.add(this.redParticles);

    // Blue particles geometry & material
    const blueGeom = new THREE.BufferGeometry();
    const bluePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      this.blueParticleData.push({ t, speed: 0.12 + Math.random() * 0.08 });
      const pt = this.blueCurve.getPoint(t);
      bluePositions[i * 3] = pt.x + (Math.random() - 0.5) * 0.08;
      bluePositions[i * 3 + 1] = pt.y + (Math.random() - 0.5) * 0.08;
      bluePositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.08;
    }
    blueGeom.setAttribute('position', new THREE.BufferAttribute(bluePositions, 3));

    const blueMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.085,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    this.blueParticles = new THREE.Points(blueGeom, blueMat);
    this.particlesGroup.add(this.blueParticles);
  }

  updateBloodParticles(delta) {
    if (!this.showBloodFlow || !this.isPlaying) return;

    // Update Red
    const redPos = this.redParticles.geometry.attributes.position;
    for (let i = 0; i < this.redParticleData.length; i++) {
      const p = this.redParticleData[i];
      p.t = (p.t + p.speed * delta * (this.bpm / 72)) % 1.0;
      const pt = this.redCurve.getPoint(p.t);
      redPos.setXYZ(i, pt.x, pt.y, pt.z);
    }
    redPos.needsUpdate = true;

    // Update Blue
    const bluePos = this.blueParticles.geometry.attributes.position;
    for (let i = 0; i < this.blueParticleData.length; i++) {
      const p = this.blueParticleData[i];
      p.t = (p.t + p.speed * delta * (this.bpm / 72)) % 1.0;
      const pt = this.blueCurve.getPoint(p.t);
      bluePos.setXYZ(i, pt.x, pt.y, pt.z);
    }
    bluePos.needsUpdate = true;
  }

  /**
   * Creates or updates 3D pins based on the annotation store
   */
  updatePins(annotations, selectedId = null) {
    // Clear old pin objects
    while (this.pinsGroup.children.length > 0) {
      const child = this.pinsGroup.children[0];
      this.pinsGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    }
    this.pinMeshes.clear();

    if (!this.showAnnotations) return;

    annotations.forEach(ann => {
      const pinObj = this.createPinMesh(ann, ann.id === selectedId);
      this.pinsGroup.add(pinObj);
      this.pinMeshes.set(ann.id, pinObj);
    });
  }

  createPinMesh(annotation, isSelected = false) {
    const group = new THREE.Group();
    group.position.set(annotation.position.x, annotation.position.y, annotation.position.z);
    group.userData = { id: annotation.id, isPin: true, annotation };

    const colorHex = annotation.color || '#e63946';
    const color = new THREE.Color(colorHex);

    // Glowing core sphere
    const sphereRadius = isSelected ? 0.08 : 0.055;
    const sphereGeom = new THREE.SphereGeometry(sphereRadius, 18, 18);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isSelected ? 0xffffff : color,
      toneMapped: false
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    group.add(sphere);

    // Outer pulsing ring / halo
    const ringRadius = isSelected ? 0.15 : 0.11;
    const ringGeom = new THREE.RingGeometry(ringRadius * 0.7, ringRadius, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isSelected ? 0.95 : 0.65,
      toneMapped: false
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.name = 'pulseRing';
    group.add(ring);

    // Vertical stalk line pointing to anatomy surface
    const stalkGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8);
    const stalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
    const stalk = new THREE.Mesh(stalkGeom, stalkMat);
    stalk.position.y = -0.09;
    group.add(stalk);

    return group;
  }

  /**
   * Cardiac cycle physics deformation and heartbeat sound trigger
   */
  updateCardiacCycle(delta) {
    if (!this.isPlaying) return;

    const cycleDuration = 60 / this.bpm;
    this.cycleTime = (this.cycleTime + delta) % cycleDuration;
    const phase = this.cycleTime / cycleDuration; // 0.0 to 1.0

    // Trigger synchronized sound at phase start
    if (phase < 0.08 && performance.now() - this.lastSoundBeat > cycleDuration * 600) {
      this.lastSoundBeat = performance.now();
      heartAudio.playHeartbeat(this.bpm);
    }

    // Cardiac systole contraction physics:
    // Ventricular systole occurs between phase 0.0 and 0.35 (rapid squeeze + apex twist)
    let contractFactor = 0;
    if (phase < 0.12) {
      // Rapid isovolumetric contraction (S1)
      contractFactor = Math.sin((phase / 0.12) * Math.PI * 0.5) * 0.09;
    } else if (phase < 0.35) {
      // Systolic ejection (S2)
      const p = (phase - 0.12) / 0.23;
      contractFactor = 0.09 * (1.0 - Math.sin(p * Math.PI * 0.5) * 0.6);
    } else if (phase < 0.5) {
      // Diastolic relaxation
      const p = (phase - 0.35) / 0.15;
      contractFactor = 0.036 * (1.0 - p);
    } else {
      // Diastasis / filling pause
      contractFactor = 0;
    }

    // Apply physiological cardiac twist & squeeze
    const scaleY = 1.0 + contractFactor * 0.6;
    const scaleXZ = 1.0 - contractFactor * 0.8;
    this.heartGroup.scale.set(scaleXZ, scaleY, scaleXZ);

    // Subtle apical torsional twist (vortex twist)
    this.heartGroup.rotation.y = -0.15 + contractFactor * 0.45;

    // Pulse the annotation rings
    const ringPulse = 1.0 + Math.sin(this.clock.getElapsedTime() * 4) * 0.18;
    this.pinsGroup.children.forEach(pin => {
      const ring = pin.getObjectByName('pulseRing');
      if (ring) {
        ring.scale.set(ringPulse, ringPulse, ringPulse);
        ring.quaternion.copy(this.camera.quaternion); // billboard ring to face camera
      }
    });
  }

  /**
   * Smooth camera glide to an anatomical focus point
   */
  flyTo(targetPos, distance = 3.2) {
    let dir = new THREE.Vector3().subVectors(this.camera.position, targetPos);
    if (dir.lengthSq() < 0.0001) {
      dir.set(0, 0, 1);
    } else {
      dir.normalize();
    }
    const destination = new THREE.Vector3().addVectors(targetPos, dir.multiplyScalar(distance));

    this.camStart.pos.copy(this.camera.position);
    this.camStart.look.copy(this.controls.target);

    this.camTarget.pos.copy(destination);
    this.camTarget.look.copy(targetPos);
    this.camTarget.isAnimating = true;
    this.camTarget.progress = 0;
  }

  updateCameraAnimation(delta) {
    if (!this.camTarget.isAnimating) return;

    this.camTarget.progress += delta * 1.8;
    const t = Math.min(1.0, this.camTarget.progress);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    this.camera.position.lerpVectors(this.camStart.pos, this.camTarget.pos, ease);
    this.controls.target.lerpVectors(this.camStart.look, this.camTarget.look, ease);

    if (t >= 1.0) {
      this.camera.position.copy(this.camTarget.pos);
      this.controls.target.copy(this.camTarget.look);
      this.camTarget.isAnimating = false;
    }
  }

  /**
   * Switch Visual / Shading Modes
   * Traverses only the heart geometry (preserves annotation pins & particle systems)
   */
  setRenderMode(mode) {
    this.renderMode = mode;
    const isWire = mode === 'wireframe';
    const isXray = mode === 'xray';
    const isColored = mode === 'colored';

    this.heartGroup.traverse(node => {
      if (node.isMesh && node.material) {
        node.material.wireframe = isWire;

        if (isXray) {
          node.material.transparent = true;
          node.material.opacity = 0.35;
          node.material.depthWrite = false;
        } else {
          node.material.transparent = node.material === this.materials.valves;
          node.material.opacity = node.material === this.materials.valves ? 0.88 : 1.0;
          node.material.depthWrite = true;
        }
      }
    });

    if (isColored) {
      // Oxygenated chambers and vessels (Bright Clinical Red)
      this.materials.leftVentricle.color.setHex(0xd90429);
      this.materials.leftAtrium.color.setHex(0xd90429);
      this.materials.aorta.color.setHex(0xd90429);
      this.materials.pulmonaryVeins.color.setHex(0xd90429);

      // Deoxygenated chambers and vessels (Royal Clinical Blue)
      this.materials.rightVentricle.color.setHex(0x0077b6);
      this.materials.rightAtrium.color.setHex(0x0077b6);
      this.materials.pulmonaryArtery.color.setHex(0x0077b6);
      this.materials.venaCava.color.setHex(0x0077b6);
    } else {
      // Restore realistic anatomical colors
      this.materials.leftVentricle.color.setHex(0x931828);
      this.materials.rightVentricle.color.setHex(0x931828);
      this.materials.leftAtrium.color.setHex(0x931828);
      this.materials.rightAtrium.color.setHex(0x931828);
      this.materials.septum.color.setHex(0x821c2a);
      this.materials.aorta.color.setHex(0xc81e2b);
      this.materials.pulmonaryArtery.color.setHex(0x2563eb);
      this.materials.venaCava.color.setHex(0x1d4ed8);
      this.materials.pulmonaryVeins.color.setHex(0xd92d3c);
    }
  }

  setCrossSection(enabled) {
    this.isCrossSection = enabled;
    this.internalGroup.visible = enabled;

    // Apply clipping plane to myocardium
    this.renderer.clippingPlanes = enabled ? [this.clipPlane] : [];
  }

  setBpm(bpm) {
    this.bpm = Math.max(30, Math.min(220, bpm));
  }

  setBloodFlow(enabled) {
    this.showBloodFlow = enabled;
    this.particlesGroup.visible = enabled;
  }

  setAnnotationsVisible(enabled) {
    this.showAnnotations = enabled;
    this.pinsGroup.visible = enabled;
  }

  setAddPinMode(enabled) {
    this.isAddPinMode = enabled;
    this.container.style.cursor = enabled ? 'crosshair' : 'default';
    if (this.onAddPinModeChange) {
      this.onAddPinModeChange(enabled);
    }
  }

  resetCameraView(view = 'anterior') {
    let targetPos = new THREE.Vector3(0, 0.2, 5.2);
    switch (view) {
      case 'anterior':   // Front / Yeeso
        targetPos.set(0, 0.2, 5.2);
        break;
      case 'posterior':  // Back / Caggal
        targetPos.set(0, 0.2, -5.2);
        break;
      case 'left':       // Left lateral / Nano
        targetPos.set(-5.2, 0.2, 0);
        break;
      case 'right':      // Right lateral / Ñaamo
        targetPos.set(5.2, 0.2, 0);
        break;
      case 'superior':   // Top-down / Dow
        targetPos.set(0, 5.2, 0.05);
        break;
    }
    this.camStart.pos.copy(this.camera.position);
    this.camStart.look.copy(this.controls.target);
    this.camTarget.pos.copy(targetPos);
    this.camTarget.look.set(0, 0, 0);
    this.camTarget.isAnimating = true;
    this.camTarget.progress = 0;
  }

  setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', () => {
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    const updatePointerCoords = (e) => {
      const rect = this.container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Pointer move for hover raycasting
    this.container.addEventListener('pointermove', (e) => {
      updatePointerCoords(e);
      this.checkHover();
    });

    let pointerDownPos = { x: 0, y: 0 };
    let pointerDownTime = 0;

    // Track click origin to differentiate camera drags from genuine clicks
    this.container.addEventListener('pointerdown', (e) => {
      updatePointerCoords(e);
      pointerDownPos = { x: e.clientX, y: e.clientY };
      pointerDownTime = performance.now();
    });

    this.container.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      const elapsed = performance.now() - pointerDownTime;

      // Ignore camera drag / orbit gestures (> 6px movement)
      if (dist > 6 || elapsed > 600) return;

      updatePointerCoords(e);
      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (this.isAddPinMode) {
        // Intersect heart meshes to place pin exactly on surface
        const hits = this.raycaster.intersectObjects(this.heartGroup.children, true);
        if (hits.length > 0) {
          const hit = hits[0];
          // Offset slightly along surface normal so pin sits just above geometry
          const normal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
          normal.transformDirection(hit.object.matrixWorld);
          const pos = hit.point.clone().add(normal.multiplyScalar(0.08));

          if (this.onAddPinCoords) {
            this.onAddPinCoords(pos);
          }
          this.setAddPinMode(false);
          return;
        }
      }

      // Check pin intersection
      const pinHits = this.raycaster.intersectObjects(this.pinsGroup.children, true);
      if (pinHits.length > 0) {
        // Find ancestor group with userData
        let curr = pinHits[0].object;
        while (curr && !curr.userData.isPin && curr.parent) {
          curr = curr.parent;
        }
        if (curr && curr.userData.id && this.onSelectPin) {
          this.onSelectPin(curr.userData.id);
        }
      }
    });
  }

  checkHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check Pin hover
    const pinHits = this.raycaster.intersectObjects(this.pinsGroup.children, true);
    if (pinHits.length > 0) {
      let curr = pinHits[0].object;
      while (curr && !curr.userData.isPin && curr.parent) {
        curr = curr.parent;
      }
      if (curr && curr.userData.annotation) {
        this.container.style.cursor = 'pointer';
        if (this.onHoverPart) {
          this.onHoverPart(curr.userData.annotation.title_pulaar, curr.userData.annotation);
        }
        return;
      }
    }

    // 2. Check Anatomical part hover
    const heartHits = this.raycaster.intersectObjects(this.heartGroup.children, true);
    if (heartHits.length > 0) {
      let hit = heartHits[0].object;
      while (hit && !hit.userData.title && hit.parent && hit.parent !== this.heartGroup) {
        hit = hit.parent;
      }
      if (hit && hit.userData.title) {
        this.container.style.cursor = this.isAddPinMode ? 'crosshair' : 'pointer';
        if (this.onHoverPart) {
          this.onHoverPart(hit.userData.title, hit.userData);
        }
        return;
      }
    }

    this.container.style.cursor = this.isAddPinMode ? 'crosshair' : 'default';
    if (this.onHoverPart) {
      this.onHoverPart(null, null);
    }
  }

  /**
   * Captures high-res canvas image for download
   */
  captureSnapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Controls update
    this.controls.update();

    // 2. Camera animated fly-to
    this.updateCameraAnimation(delta);

    // 3. Heartbeat cycle deformation
    this.updateCardiacCycle(delta);

    // 4. Blood circulation particles
    this.updateBloodParticles(delta);

    // 5. Render
    this.renderer.render(this.scene, this.camera);
  }
}
