import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Encounter, LearningModule, Metrics, Village } from './types';

type Status = 'available' | 'active' | 'mastered' | 'locked';
type Resources = { geometries: Set<T.BufferGeometry>; materials: Map<string, T.MeshStandardMaterial> };

const biomes = {
  meadow: { sky: '#dce9dc', turf: '#98bc7e', earth: '#a88b65', path: '#e8d8ad', leaf: '#69955b', water: '#82c6ca', roof: '#b97158' },
  coast: { sky: '#dbeef0', turf: '#d7d4a0', earth: '#bd9e76', path: '#f3e3ba', leaf: '#75a697', water: '#70bacb', roof: '#659da6' },
  highlands: { sky: '#e2dfeb', turf: '#9baa8a', earth: '#888b87', path: '#d4cdb8', leaf: '#587c78', water: '#93b6cf', roof: '#8881a2' },
} satisfies Record<Village['biome'], Record<string, string>>;

/** A self-contained village; all DOM and GPU resources belong to this instance. */
export function createScene(
  host: HTMLElement,
  village: Village,
  modules: LearningModule[],
  onSelect: (id: string) => void,
) {
  const palette = biomes[village.biome];
  const localModules = modules.filter(m => m.villageId === village.id);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(36, 1, .1, 400);
  // Let WebGL construction errors reach the caller's fallback UI.
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  const permanent: Resources = { geometries: new Set(), materials: new Map() };
  const monsterResources: Resources = { geometries: new Set(), materials: new Map() };
  const cleanups: Array<() => void> = [];
  let controls: OrbitControls | undefined;
  let observer: ResizeObserver | undefined;
  let disposed = false;
  const originalStyle = { height: host.style.height, position: host.style.position };
  let ownedHeight = '', ownedPosition = '';
  const labels = document.createElement('div');
  labels.className = 'scene-labels';
  Object.assign(labels.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' });
  labels.setAttribute('role', 'group');
  labels.setAttribute('aria-label', `${village.title} — learning places`);

  function release(resources: Resources) {
    resources.geometries.forEach(g => g.dispose());
    resources.materials.forEach(m => m.dispose());
    resources.geometries.clear();
    resources.materials.clear();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    observer?.disconnect();
    cleanups.forEach(cleanup => cleanup());
    controls?.dispose();
    scene.traverse(object => { if (object instanceof T.Light && 'shadow' in object) (object as T.DirectionalLight).shadow?.dispose(); });
    release(monsterResources);
    release(permanent);
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    labels.remove();
    if (host.style.height === ownedHeight) host.style.height = originalStyle.height;
    if (host.style.position === ownedPosition) host.style.position = originalStyle.position;
  }

  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none' });
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', `${village.title}. Drag to orbit, scroll to zoom. Use the place buttons to travel.`);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    ownedPosition = host.style.position;
    host.append(renderer.domElement, labels);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = motion.matches;
    let paused = false;
    controls = new OrbitControls(camera, renderer.domElement);
    const orbit = controls;
    orbit.enableDamping = !reduced;
    orbit.enablePan = false;
    orbit.minPolarAngle = .35;
    orbit.maxPolarAngle = Math.PI / 2.5;

    function material(color: string, resources = permanent) {
      let result = resources.materials.get(color);
      if (!result) {
        result = new T.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
        resources.materials.set(color, result);
      }
      return result;
    }
    function mesh(geometry: T.BufferGeometry, color: string, x: number, y: number, z: number, parent: T.Object3D = scene, resources = permanent) {
      resources.geometries.add(geometry);
      const result = new T.Mesh(geometry, material(color, resources));
      result.position.set(x, y, z);
      result.castShadow = true;
      result.receiveShadow = true;
      parent.add(result);
      return result;
    }
    function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, parent: T.Object3D = scene, resources = permanent) {
      return mesh(new T.BoxGeometry(w, h, d), color, x, y, z, parent, resources);
    }
    function ball(r: number, color: string, x: number, y: number, z: number, parent: T.Object3D = scene, resources = permanent) {
      return mesh(new T.IcosahedronGeometry(r, 0), color, x, y, z, parent, resources);
    }
    function cone(r: number, h: number, color: string, x: number, y: number, z: number, parent: T.Object3D = scene, resources = permanent) {
      return mesh(new T.ConeGeometry(r, h, 6), color, x, y, z, parent, resources);
    }
    function path(from: T.Vector3, to: T.Vector3) {
      const length = from.distanceTo(to);
      if (length < .01) return;
      const strip = box(.85, .045, length + .3, palette.path, (from.x + to.x) / 2, .15, (from.z + to.z) / 2);
      strip.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
    }

    const halfX = Math.max(11.5, ...localModules.map(m => Math.abs(m.position[0]) + 3));
    const front = Math.max(9, ...localModules.map(m => m.position[1] + 4));
    const arenaZ = Math.min(-7, ...localModules.map(m => m.position[1])) - 5;
    const back = arenaZ - 3.4;
    const centerZ = (front + back) / 2;
    const depth = front - back;
    const radius = Math.hypot(halfX, depth / 2, 4);
    scene.background = new T.Color(palette.sky);
    scene.fog = new T.Fog(palette.sky, radius * 3, radius * 8);
    const hemi = new T.HemisphereLight('#fff7df', '#718677', 2.6);
    const sun = new T.DirectionalLight('#fff2d6', 3);
    sun.position.set(-15, 30, 15);
    sun.target.position.z = centerZ;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, far: 120 });
    sun.shadow.bias = -.001;
    sun.shadow.normalBias = .035;
    scene.add(hemi, sun, sun.target);
    box(halfX * 2, 1.35, depth, palette.earth, 0, -.65, centerZ);
    box(halfX * 2, .18, depth, palette.turf, 0, .06, centerZ);
    box(3.4, .06, 3.4, palette.path, 0, .16, 0);
    path(new T.Vector3(), new T.Vector3(0, 0, arenaZ));
    localModules.forEach(m => {
      const [x, z] = m.position;
      path(new T.Vector3(), new T.Vector3(0, 0, z + 1.55));
      path(new T.Vector3(0, 0, z + 1.55), new T.Vector3(x, 0, z + 1.55));
    });

    const water = village.biome === 'coast'
      ? box(halfX * 2, .08, 2.2, palette.water, 0, .18, front - 1.1)
      : mesh(new T.CylinderGeometry(1.65, 1.65, .06, 24), palette.water, halfX - 2.2, .18, front - 2.4);
    if (village.biome !== 'coast') water.scale.z = .65;
    const ripples: T.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const ripple = mesh(new T.TorusGeometry(.4 + i * .35, .018, 3, 24), '#d7ebe1', water.position.x, .235, water.position.z);
      ripple.rotation.x = -Math.PI / 2;
      ripple.scale.y = .65;
      ripples.push(ripple);
    }
    if (village.biome === 'coast') {
      for (let i = 0; i < 8; i++) box(1.5, .12, .28, '#ad8a66', halfX - 3, .35, front - 2.5 + i * .3);
      for (const x of [halfX - 3.65, halfX - 2.35]) box(.12, .8, .12, '#826e5b', x, .32, front - .3);
    }
    // Seeded garden dressing stays stable when navigating back to a village.
    let seed = Array.from(village.id).reduce((sum, c) => sum + c.charCodeAt(0), 21);
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let i = 0; i < 100; i++) {
      const x = (random() * 2 - 1) * (halfX - .6), z = back + .7 + random() * (depth - 1.4);
      if (Math.abs(x) < 1.4 || Math.hypot(x, z - arenaZ) < 3.8 || localModules.some(m => Math.hypot(x - m.position[0], z - m.position[1]) < 2.5 || Math.abs(z - m.position[1] - 1.55) < .6) || z > front - 3) continue;
      const edge = Math.abs(x) > halfX - 3 || z < back + 2;
      if (edge && i % 3 !== 0) {
        const size = .65 + random() * .45;
        box(.2, 1.1, .2, '#927459', x, .7, z);
        if (village.biome === 'coast') {
          for (let n = 0; n < 5; n++) {
            const a = n * Math.PI * 2 / 5;
            const leaf = ball(.65, palette.leaf, x + Math.cos(a) * .4, 1.65, z + Math.sin(a) * .4);
            leaf.scale.set(1.3, .22, .55); leaf.rotation.y = -a;
          }
        } else {
          cone(.85 * size, 1.65 * size, palette.leaf, x, 1.45, z);
          cone(.6 * size, 1.25 * size, village.biome === 'highlands' ? '#cbd6ca' : '#82a96e', x, 2.1, z);
        }
      } else if (village.biome === 'highlands' && i % 3 === 0) {
        const rock = ball(.35 + random() * .4, '#b0b0ac', x, .3, z); rock.scale.y = .8;
        cone(.12, .65, '#b7a6ce', x + .25, .45, z);
      } else {
        box(.03, .2, .03, palette.leaf, x, .24, z);
        ball(.1, ['#f4d689', '#f4e7d2', '#d8a5b7'][i % 3], x, .36, z);
      }
    }
    for (let i = 0; i < 12; i++) {
      const x = -halfX + 1 + i * .48;
      box(.09, .55, .09, '#efe1bc', x, .43, front - 3);
      if (i < 11) box(.48, .08, .08, '#efe1bc', x + .24, .57, front - 3);
    }
    for (let row = 0; row < 3; row++) {
      box(2.3, .06, .32, '#947153', -halfX + 3, .2, front - 2.3 + row * .45);
      for (let n = 0; n < 7; n++) ball(.12, row % 2 ? '#9caf68' : '#e5ab67', -halfX + 2.1 + n * .3, .32, front - 2.3 + row * .45);
    }

    function spirit(color: string, variant: number, parent: T.Object3D = scene) {
      const group = new T.Group(); parent.add(group);
      ball(.24, color, 0, .38, 0, group);
      ball(.21, color, 0, .64, .03, group);
      for (const side of [-1, 1]) {
        cone(.075, .24, color, side * .12, .85, .02, group);
        ball(.031, '#384b41', side * .075, .67, .21, group);
        if (variant % 3 === 1) {
          const wing = ball(.2, '#fff0c6', side * .28, .48, 0, group); wing.scale.set(1.3, .25, .7);
        }
      }
      ball(.08, '#fff2d3', 0, .5, .21, group);
      if (variant % 3 === 2) { const shell = ball(.29, '#759c89', 0, .36, -.12, group); shell.scale.set(1, .7, 1.2); }
      return group;
    }
    const rotors: T.Group[] = [];
    const windows: T.Mesh[] = [];
    const guardians: T.Group[] = [];
    const pickable: T.Object3D[] = [];
    const places = new Map<string, { group: T.Group; button: HTMLButtonElement; anchor: T.Vector3; marker: T.Mesh; status: Status; module: LearningModule }>();
    const statusColors: Record<Status, string> = { available: '#b4c4a0', active: '#f5c877', mastered: '#83bb9a', locked: '#969c9b' };
    localModules.forEach((module, index) => {
      const group = new T.Group(); group.position.set(module.position[0], 0, module.position[1]);
      group.userData.moduleId = module.id; scene.add(group); pickable.push(group);
      const h = index % 4 === 2 ? 1.9 : 1.45;
      box(2.5, .17, 2.1, '#c5bea0', 0, .25, 0, group);
      box(1.95, h, 1.6, '#f3e5c5', 0, h / 2 + .33, 0, group);
      box(2.02, .12, 1.65, '#ad8966', 0, .5, 0, group);
      const roof = mesh(new T.ConeGeometry(1.75, 1.1, 4), module.color || palette.roof, 0, h + .84, 0, group);
      roof.rotation.y = Math.PI / 4; roof.scale.z = .85;
      box(.46, .86, .09, '#795f4f', 0, .78, .86, group);
      ball(.035, '#efd18a', .13, .78, .92, group);
      for (const x of [-.63, .63]) {
        windows.push(box(.4, .43, .08, '#acd2cb', x, 1.25, .84, group));
        box(.045, .45, .1, '#fff0cf', x, 1.25, .9, group);
        box(.42, .045, .1, '#fff0cf', x, 1.25, .9, group);
        box(.53, .16, .22, '#b38a64', x, .98, 1, group);
        for (const dx of [-.14, .14]) ball(.09, '#d8a4ac', x + dx, 1.12, 1.02, group);
      }
      box(.29, .6, .33, '#bd9d85', .59, h + .92, -.42, group);
      if (index % 4 === 1) {
        const rotor = new T.Group(); rotor.position.set(0, h + .85, 1.05); group.add(rotor);
        box(.13, 1.8, .09, '#fff0cc', 0, 0, 0, rotor);
        box(1.8, .13, .09, '#fff0cc', 0, 0, 0, rotor);
        ball(.14, '#8b7151', 0, 0, .1, rotor); rotors.push(rotor);
      } else if (index % 4 === 3) {
        for (let n = 0; n < 3; n++) mesh(new T.OctahedronGeometry(.24), '#b8a5d0', -.7 + n * .7, .58, 1.2, group);
      }
      const marker = mesh(new T.TorusGeometry(1.35, .045, 5, 32), statusColors.available, 0, .36, 0, group);
      marker.rotation.x = Math.PI / 2;
      const guardian = spirit(module.color, index);
      guardian.position.set(module.position[0] + 1.15, .15, module.position[1] + 1.1);
      guardian.userData.moduleId = module.id; guardians.push(guardian); pickable.push(guardian);
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'scene-label';
      button.textContent = `${module.icon} ${module.place || module.title}`;
      button.title = `${module.title} · ${module.spirit}`;
      button.style.setProperty('--module-color', module.color);
      Object.assign(button.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'auto', maxWidth: 'min(180px, 43%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minHeight: '32px' });
      const activate = () => activatePlace(module.id);
      button.addEventListener('click', activate);
      cleanups.push(() => button.removeEventListener('click', activate));
      labels.append(button);
      places.set(module.id, { group, button, anchor: new T.Vector3(module.position[0], h + 1.7, module.position[1]), marker, status: 'available', module });
    });

    const player = spirit('#f3cf83', 0);
    player.position.set(0, .17, 1);
    cone(.25, .23, '#b97458', 0, .91, .03, player);
    const selectionRing = mesh(new T.TorusGeometry(1.53, .055, 6, 40), '#fff1ad', 0, .38, 0);
    selectionRing.rotation.x = Math.PI / 2; selectionRing.visible = false;
    let selected: string | null = null;
    let waypoints: T.Vector3[] = [];
    function updateLabel(id: string) {
      const place = places.get(id)!;
      place.button.dataset.status = place.status;
      for (const status of Object.keys(statusColors)) place.button.classList.toggle(status, place.status === status);
      place.button.classList.toggle('selected', selected === id);
      place.button.setAttribute('aria-pressed', String(selected === id));
      place.button.setAttribute('aria-disabled', String(place.status === 'locked'));
      place.button.setAttribute('aria-label', `${place.module.title}, ${place.module.place}, ${place.module.spirit}, ${place.status}`);
      place.marker.material = material(statusColors[place.status]);
    }
    function select(id: string) {
      const place = places.get(id);
      if (disposed || !place || place.status === 'locked') return;
      const changed = selected !== id;
      selected = id;
      selectionRing.visible = true;
      selectionRing.position.set(place.group.position.x, .38, place.group.position.z);
      places.forEach((_, key) => updateLabel(key));
      if (!changed) return;
      const destination = new T.Vector3(place.group.position.x, .17, place.group.position.z + 1.55);
      // Horizontal house lanes join the central north/south footpath.
      waypoints = [new T.Vector3(0, .17, player.position.z), new T.Vector3(0, .17, destination.z), destination];
      if (reduced) { player.position.copy(destination); waypoints = []; }
    }
    function activatePlace(id: string) {
      if (disposed || places.get(id)?.status === 'locked') return;
      select(id); onSelect(id);
    }
    places.forEach((_, id) => updateLabel(id));

    const arena = new T.Group(); arena.position.set(0, 0, arenaZ); scene.add(arena);
    mesh(new T.CylinderGeometry(2.9, 3.05, .24, 12), '#afa895', 0, .23, 0, arena);
    const arenaRing = mesh(new T.TorusGeometry(2.65, .065, 6, 48), '#d5bc8d', 0, .39, 0, arena);
    arenaRing.rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      cone(.17, .65, '#b2a6c9', Math.cos(a) * 2.7, .68, Math.sin(a) * 2.7, arena);
    }
    const monster = new T.Group(); monster.position.y = .38; arena.add(monster);
    let encounterKind: Encounter['kind'] | null = null;
    let encounterSeverity = .5;
    function encounter(kind: Encounter['kind'] | null, severity = .5) {
      if (disposed) return;
      const strength = Number.isFinite(severity) ? T.MathUtils.clamp(severity, 0, 1) : .5;
      if (kind === encounterKind && strength === encounterSeverity) return;
      encounterKind = kind; encounterSeverity = strength;
      monster.clear(); release(monsterResources);
      monster.rotation.set(0, 0, 0); monster.position.y = .38;
      monster.visible = kind !== null;
      arenaRing.material = material(kind ? '#d79886' : '#d5bc8d');
      if (!kind) return;
      const colors: Record<Encounter['kind'], string> = { fog: '#bac8d6', scope: '#c4a2cf', ghost: '#c7d9df', mimic: '#bd9360', golem: '#9da897', mold: '#a7b57b', ogre: '#b1ba8c', serpent: '#80b5a4', dragon: '#c295ad', worm: '#c9aa94', giant: '#baab98', hydra: '#8eafa1', titan: '#9b9db6' };
      const color = colors[kind];
      const orb = (r: number, x: number, y: number, z: number, c = color) => ball(r, c, x, y, z, monster, monsterResources);
      const block = (w: number, h: number, d: number, x: number, y: number, z: number, c = color) => box(w, h, d, c, x, y, z, monster, monsterResources);
      const spike = (r: number, h: number, x: number, y: number, z: number, c = color) => cone(r, h, c, x, y, z, monster, monsterResources);
      const eyes = (x: number, y: number, z: number, spread = .16) => {
        for (const side of [-1, 1]) { orb(.075, x + side * spread, y, z, '#fff4d9'); orb(.036, x + side * spread, y, z + .055, '#394a47'); }
      };
      if (kind === 'hydra') {
        orb(.75, 0, .6, -.1);
        const heads = 2 + Math.round(strength * 5);
        for (let i = 0; i < heads; i++) {
          const a = (i / (heads - 1) - .5) * 2.5;
          const x = Math.sin(a) * 1.2, y = 1.4 + Math.cos(a) * .45, z = Math.cos(a) * .3;
          for (let n = 1; n <= 3; n++) orb(.22, x * n / 3, .6 + (y - .6) * n / 3, z * n / 3);
          orb(.29, x, y, z); eyes(x, y + .04, z + .25, .1);
          spike(.09, .25, x, y + .34, z, '#edd7a8');
        }
      } else if (kind === 'serpent' || kind === 'worm') {
        const segments = 9 + Math.round(strength * 7);
        for (let i = 0; i < segments; i++) {
          const t = i / (segments - 1), a = t * Math.PI * 2.4;
          orb(.18 + t * .23, Math.sin(a) * (1 - t * .45), .25 + t * 1.45, Math.cos(a) * .65, kind === 'worm' && i % 2 ? '#dfc3a6' : color);
        }
        const x = Math.sin(Math.PI * 2.4) * .55, z = Math.cos(Math.PI * 2.4) * .65;
        orb(.42, x, 1.75, z); eyes(x, 1.85, z + .35);
        if (kind === 'serpent') spike(.14, .42, x, 2.24, z, '#efd29e');
      } else if (kind === 'ghost' || kind === 'fog') {
        const body = orb(.8, 0, 1.2, 0); body.scale.y = 1.2;
        for (let i = 0; i < 5; i++) orb(.23, -.6 + i * .3, .5, .07);
        eyes(0, 1.5, .7, .22);
        for (const side of [-1, 1]) { const arm = orb(.3, side * .85, 1.1, 0); arm.scale.set(1.6, .5, .65); }
        if (kind === 'fog') for (let i = 0; i < 8; i++) orb(.25 + strength * .15, Math.sin(i * 2.4) * 1.5, .35 + i % 3 * .35, Math.cos(i * 2.4));
        const bodyMaterial = material(color, monsterResources); bodyMaterial.transparent = true; bodyMaterial.opacity = .6 + strength * .3; bodyMaterial.depthWrite = false;
      } else if (kind === 'mimic') {
        block(1.55, .7, 1.05, 0, .4, 0);
        const lid = block(1.65, .28, 1.15, 0, 1 + strength * .25, -.12); lid.rotation.x = -.25 - strength * .4;
        for (const x of [-.55, .55]) block(.13, .72, 1.08, x, .42, 0, '#ead298');
        for (let i = 0; i < 5; i++) spike(.085, .2, -.56 + i * .28, .85, .48, '#fff1d5');
        eyes(0, 1.08 + strength * .25, .5, .3);
      } else if (kind === 'mold') {
        for (let i = 0; i < 7; i++) {
          const x = Math.sin(i * 2.4) * .95, z = Math.cos(i * 2.4) * .7, h = .5 + (i % 3) * .3 + strength * .3;
          block(.2, h, .2, x, h / 2, z, '#eee0ba');
          const cap = orb(.45, x, h, z); cap.scale.y = .5;
          orb(.07, x + .12, h + .17, z + .1, '#f2e8c4');
        }
        eyes(0, .6, .85);
      } else if (kind === 'scope') {
        orb(.7, 0, 1, 0); eyes(0, 1.1, .65);
        for (let i = 0; i < 5 + Math.round(strength * 4); i++) {
          const a = i * 2.4; const bud = orb(.23, Math.sin(a) * 1.15, 1 + Math.cos(a) * .8, Math.cos(i) * .4);
          bud.scale.y = 1.4;
        }
      } else {
        const titan = kind === 'titan', dragon = kind === 'dragon';
        block(1.1, 1.1, .75, 0, 1.15, 0);
        orb(.53, 0, 2, .05); eyes(0, 2.08, .5, .2);
        for (const side of [-1, 1]) {
          block(.36, .65, .5, side * .36, .35, .03);
          const arm = block(.37, 1, .43, side * .85, 1.2, 0); arm.rotation.z = side * (.12 + strength * .2);
          if (titan || kind === 'golem') orb(.37, side * .75, 1.7, 0, '#c7c7bd');
          if (dragon || kind === 'ogre') spike(.13, .45, side * .35, 2.5, 0, '#f0dcb3');
          if (dragon) { const wing = spike(.8, 1.5, side * 1.1, 1.4, -.3); wing.scale.z = .14; wing.rotation.z = side * -.8; }
        }
        if (titan) {
          mesh(new T.OctahedronGeometry(.3), '#f4d694', 0, 1.4, .45, monster, monsterResources);
          for (let i = 0; i < 5; i++) spike(.13, .35 + strength * .35, -.4 + i * .2, 2.5, 0, '#d4c1e4');
        }
        if (kind === 'giant') spike(.6, .55, 0, 2.5, .05, '#95785e');
      }
      monster.scale.setScalar(.8 + strength * .4);
    }

    const metricKeys: Array<keyof Metrics> = ['latency', 'availability', 'consistency', 'throughput', 'complexity'];
    const metricBars = metricKeys.map((_, i) => {
      mesh(new T.CylinderGeometry(.2, .24, .15, 6), '#b9ad93', -1.4 + i * .7, .4, 2, arena);
      return box(.18, 1, .18, ['#d5b885', '#93b99b', '#aaa4cb', '#8dbcc5', '#cb9f9f'][i], -1.4 + i * .7, .85, 2, arena);
    });
    function metrics(values: Metrics) {
      if (disposed) return;
      metricKeys.forEach((key, i) => {
        const value = Number.isFinite(values[key]) ? values[key] : 0;
        const height = .12 + T.MathUtils.clamp(value, 0, 100) / 100 * .9;
        metricBars[i].scale.y = height; metricBars[i].position.y = .48 + height / 2;
      });
      renderer.domElement.setAttribute('aria-label', `${village.title}. ${metricKeys.map(key => `${key}: ${Number.isFinite(values[key]) ? values[key] : 'unknown'}`).join(', ')}. Drag to orbit; use place buttons to travel.`);
    }

    const raycaster = new T.Raycaster(), pointer = new T.Vector2();
    let down: { x: number; y: number; id: number } | null = null;
    const pointerDown = (event: PointerEvent) => { down = event.isPrimary && event.button === 0 ? { x: event.clientX, y: event.clientY, id: event.pointerId } : null; };
    const pointerCancel = () => { down = null; };
    const pointerUp = (event: PointerEvent) => {
      const start = down; down = null;
      if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      scene.updateMatrixWorld(true); camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickable, true)[0];
      let object: T.Object3D | null = hit?.object ?? null;
      while (object && !object.userData.moduleId) object = object.parent;
      if (object) activatePlace(object.userData.moduleId as string);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerCancel);
    cleanups.push(() => {
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerCancel);
    });
    const motionChange = () => {
      reduced = motion.matches; orbit.enableDamping = !reduced && !paused;
      if (reduced && waypoints.length) { player.position.copy(waypoints[waypoints.length - 1]); waypoints = []; }
    };
    motion.addEventListener('change', motionChange);
    cleanups.push(() => motion.removeEventListener('change', motionChange));
    let fittedDistance = 1, width = 1, height = 1;
    const homeDirection = new T.Vector3(23, 28, 32).normalize();
    function fitDistance() {
      const vertical = T.MathUtils.degToRad(camera.fov / 2);
      const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
      return radius / Math.sin(Math.min(vertical, horizontal)) * .94;
    }
    function reset() {
      if (disposed) return;
      // Flush any queued orbit momentum before restoring the home view.
      orbit.enableDamping = false; orbit.update();
      orbit.target.set(0, .7, centerZ);
      camera.position.copy(homeDirection).multiplyScalar(fittedDistance).add(orbit.target);
      orbit.update(); orbit.enableDamping = !reduced && !paused;
    }
    function resize() {
      if (disposed) return;
      width = Math.max(1, host.getBoundingClientRect().width);
      height = width < 640 ? 380 : Math.round(T.MathUtils.clamp(width * .58, 450, 550));
      ownedHeight = `${height}px`; host.style.height = ownedHeight;
      const ratio = camera.position.distanceTo(orbit.target) / fittedDistance;
      camera.aspect = width / height;
      fittedDistance = fitDistance();
      orbit.minDistance = fittedDistance * .45;
      orbit.maxDistance = fittedDistance * 1.65;
      camera.far = Math.max(400, fittedDistance * 4);
      camera.updateProjectionMatrix();
      scene.fog = new T.Fog(scene.background as T.Color, fittedDistance + radius * 1.4, fittedDistance + radius * 5);
      renderer.setSize(width, height, false);
      if (camera.position.lengthSq() === 0) reset();
      else {
        camera.position.sub(orbit.target).normalize().multiplyScalar(fittedDistance * T.MathUtils.clamp(ratio, .45, 1.65)).add(orbit.target);
        orbit.update();
      }
    }
    observer = new ResizeObserver(resize); observer.observe(host); resize();
    const projected = new T.Vector3(), delta = new T.Vector3();
    let previous: number | null = null, time = 0;
    renderer.setAnimationLoop((now: number) => {
      if (disposed) return;
      const dt = previous === null ? 0 : Math.min((now - previous) / 1000, .05); previous = now;
      const animate = !paused && !reduced;
      if (animate) {
        time += dt;
        rotors.forEach(rotor => { rotor.rotation.z += dt * .45; });
        guardians.forEach((guardian, i) => { guardian.position.y = .15 + Math.sin(time * 2 + i) * .06; });
        ripples.forEach((ripple, i) => { ripple.scale.setScalar(1 + Math.sin(time * .7 + i) * .06); });
        monster.rotation.y = Math.sin(time * .55) * .12;
        monster.position.y = .38 + Math.sin(time * 1.7) * (encounterKind === 'ghost' || encounterKind === 'fog' ? .18 : .035);
        if (waypoints.length) {
          delta.subVectors(waypoints[0], player.position); delta.y = 0;
          const distance = delta.length(), step = dt * 3.5;
          if (distance <= step) { player.position.copy(waypoints.shift()!); }
          else { player.position.addScaledVector(delta, step / distance); player.rotation.y = Math.atan2(delta.x, delta.z); }
        }
      }
      orbit.update(); camera.updateMatrixWorld();
      places.forEach(place => {
        projected.copy(place.anchor).project(camera);
        const inView = projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1;
        // Keep offscreen places in the keyboard order; reveal their button on focus.
        const focused = document.activeElement === place.button;
        place.button.style.opacity = inView || focused ? '1' : '0';
        place.button.style.pointerEvents = inView || focused ? 'auto' : 'none';
        const margin = Math.min(90, width * .215);
        const x = T.MathUtils.clamp((projected.x * .5 + .5) * width, margin, width - margin);
        const y = T.MathUtils.clamp((-.5 * projected.y + .5) * height, 20, height - 20);
        place.button.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        place.button.style.zIndex = focused ? '4' : selected === place.module.id ? '3' : '1';
      });
      renderer.render(scene, camera);
    });
    // Force the initial render inside the failure boundary for the caller's fallback.
    renderer.render(scene, camera);
    return {
      select,
      statuses(states: Record<string, Status>) {
        if (disposed) return;
        places.forEach((place, id) => {
          place.status = states[id] ?? 'available'; updateLabel(id);
          if (place.status === 'locked' && selected === id) {
            selected = null; waypoints = []; selectionRing.visible = false; updateLabel(id);
          }
        });
      },
      encounter,
      metrics,
      pause(value: boolean) { if (!disposed) { paused = value; orbit.enableDamping = !value && !reduced; } },
      night(value: boolean) {
        if (disposed) return;
        const sky = value ? '#293e50' : palette.sky;
        scene.background = new T.Color(sky);
        (scene.fog as T.Fog).color.set(sky);
        sun.intensity = value ? .65 : 3; hemi.intensity = value ? 1.1 : 2.6;
        sun.color.set(value ? '#b6c9ed' : '#fff2d6');
        const glass = material('#acd2cb'); glass.color.set(value ? '#f1cd89' : '#acd2cb');
        glass.emissive.set(value ? '#edac58' : '#000000'); glass.emissiveIntensity = value ? .55 : 0;
        windows.forEach(windowMesh => { windowMesh.material = glass; });
      },
      zoom(factor: number) {
        if (disposed || !Number.isFinite(factor) || factor <= 0) return;
        const distance = T.MathUtils.clamp(camera.position.distanceTo(orbit.target) * factor, orbit.minDistance, orbit.maxDistance);
        camera.position.sub(orbit.target).normalize().multiplyScalar(distance).add(orbit.target); orbit.update();
      },
      reset,
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
