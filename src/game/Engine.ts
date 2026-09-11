import * as THREE from 'three';
import campusPoster from '../assets/campus.jpg';
import { gameAudio } from './audio';

export interface CheckpointDef {
  id: number;
  name: string;
  short: string;
  hint: string;
  fact: string;
  question: string;
  options: string[];
  answer: number;
  pos: [number, number]; // x, z
  color: number;
  isFinish?: boolean;
}

export const CHECKPOINTS: CheckpointDef[] = [
  {
    id: 0, name: 'Plaza Central', short: 'Plaza',
    hint: 'Avanza al norte, hacia el corazón de la explanada. El haz cian te guía.',
    fact: 'La explanada de concreto con juntas de dilatación es el vestíbulo urbano del conjunto: un vacío que ordena todo el campus.',
    question: '¿Qué elemento domina la planta baja del edificio principal?',
    options: ['Muros cerrados de concreto', 'Planta libre sobre pilotis', 'Una pirámide de cristal'],
    answer: 1, pos: [0, 30], color: 0x22d3ee,
  },
  {
    id: 1, name: 'Rampas del Oeste', short: 'Rampas',
    hint: 'Gira al oeste (izquierda). Busca las rampas en zigzag del ala lateral.',
    fact: 'Las rampas exteriores en zigzag resuelven la circulación vertical sin romper la pureza del prisma blanco.',
    question: '¿Qué resuelven las rampas en zigzag del ala oeste?',
    options: ['La circulación vertical', 'La salida de agua pluvial', 'La ventilación del sótano'],
    answer: 0, pos: [-31, 6], color: 0xa78bfa,
  },
  {
    id: 2, name: 'Pórtico Pilotis', short: 'Pilotis',
    hint: 'Cruza bajo el edificio. Los pilotis liberan la planta baja: atraviésala.',
    fact: 'Los pilotis —columnas que elevan el volumen— liberan el suelo para el paso, el encuentro y el estacionamiento.',
    question: '¿Cómo se llaman las columnas que liberan la planta baja?',
    options: ['Contrafuertes', 'Pilastras', 'Pilotis'],
    answer: 2, pos: [10, -30], color: 0x34d399,
  },
  {
    id: 3, name: 'Jardín Poniente', short: 'Jardín',
    hint: 'Explora al suroeste: cruza la explanada hacia la franja verde y los árboles.',
    fact: 'La vegetación al poniente actúa como colchón térmico y contrasta con la blancura mineral del concreto.',
    question: '¿Qué función tiene la vegetación al poniente?',
    options: ['Solo decorativa', 'Colchón térmico y contraste', 'Soporte estructural'],
    answer: 1, pos: [-58, 30], color: 0x4ade80,
  },
  {
    id: 4, name: 'Mirador Oriente', short: 'Mirador',
    hint: 'Gran travesía al este: recorre toda la explanada hasta el extremo oriente.',
    fact: 'Desde el oriente se aprecia la longitud total del bloque: más de 100 metros de fachada rítmica y horizontal.',
    question: '¿Qué caracteriza la fachada del bloque principal?',
    options: ['Verticalidad gótica', 'Horizontalidad rítmica', 'Curvas orgánicas'],
    answer: 1, pos: [60, 12], color: 0xfbbf24,
  },
  {
    id: 5, name: 'Meta · Terraza Cielo', short: 'META',
    hint: '¡Último tramo! Regresa al centro del conjunto y cruza el arco dorado.',
    fact: 'La cubierta con pérgola corona el edificio: un mirador de luz que cierra el recorrido. ¡Lo lograste!',
    question: '¿Qué corona la cubierta del edificio?',
    options: ['Una pérgola mirador', 'Un helipuerto', 'Un jardín barroco'],
    answer: 0, pos: [0, -10], color: 0xf59e0b, isFinish: true,
  },
];

export interface EngineEvents {
  onCheckpoint: (index: number) => void;
  onUpdate: (snap: Snapshot) => void;
}

export interface Snapshot {
  x: number; z: number; yaw: number; pitch: number;
  speed: number; moving: boolean;
  current: number; dist: number; angleToTarget: number;
}

interface Collider { minX: number; maxX: number; minZ: number; maxZ: number; }

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d')! };
}

function concreteTexture(): THREE.CanvasTexture {
  const { c, g } = makeCanvas(512, 512);
  g.fillStyle = '#dfe3e6';
  g.fillRect(0, 0, 512, 512);
  // ruido
  for (let i = 0; i < 9000; i++) {
    const v = 200 + Math.random() * 40;
    g.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.16})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  // juntas de dilatación
  g.strokeStyle = 'rgba(120,128,135,0.55)';
  g.lineWidth = 3;
  g.strokeRect(2, 2, 508, 508);
  g.strokeStyle = 'rgba(140,148,154,0.35)';
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.moveTo(0, 256); g.lineTo(512, 256); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 26);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function cloudTexture(): THREE.CanvasTexture {
  const { c, g } = makeCanvas(256, 128);
  g.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) {
    const x = 40 + Math.random() * 176;
    const y = 45 + Math.random() * 40;
    const r = 18 + Math.random() * 30;
    const grad = g.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function textSpriteTexture(text: string, sub?: string, color = '#ffffff'): THREE.CanvasTexture {
  const { c, g } = makeCanvas(512, sub ? 160 : 120);
  g.clearRect(0, 0, 512, sub ? 160 : 120);
  // píldora fondo
  g.fillStyle = 'rgba(8,15,28,0.72)';
  const w = Math.min(500, 60 + text.length * 22 + (sub ? 40 : 0));
  const x0 = (512 - w) / 2;
  g.beginPath();
  const rr = (g as CanvasRenderingContext2D & { roundRect?: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect;
  if (rr) rr.call(g, x0, 8, w, sub ? 144 : 104, 28); else g.rect(x0, 8, w, sub ? 144 : 104);
  g.fill();
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.stroke();
  g.textAlign = 'center';
  g.fillStyle = '#ffffff';
  g.font = 'bold 44px system-ui, sans-serif';
  g.fillText(text, 256, sub ? 66 : 76);
  if (sub) {
    g.font = '30px system-ui, sans-serif';
    g.fillStyle = color;
    g.fillText(sub, 256, 118);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private events: EngineEvents;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;

  // jugador
  private pos = new THREE.Vector3(0, 1.7, 46);
  private yaw = 0; private pitch = 0;
  private keys = new Set<string>();
  private joy = { x: 0, y: 0 };
  private vrWalk = false;
  private sprint = false;
  private paused = false;
  private speedSm = 0;

  // modos
  vrMode = false;
  private gyroOn = false;
  private gyroBase: number | null = null;
  private gyroYaw = 0; private gyroPitch = 0;

  // juego
  current = 0;
  done: boolean[] = CHECKPOINTS.map(() => false);
  private cpGroups: THREE.Group[] = [];
  private cpMats: { ring: THREE.MeshBasicMaterial; beam: THREE.MeshBasicMaterial; orb: THREE.MeshStandardMaterial; label: THREE.SpriteMaterial; num: THREE.SpriteMaterial }[] = [];
  private orbs: THREE.Mesh[] = [];
  private halos: THREE.Mesh[] = [];
  private finishConfetti: THREE.Points | null = null;
  private confettiVel: Float32Array | null = null;
  private celebrating = false;

  private clouds: THREE.Sprite[] = [];
  private dust: THREE.Points | null = null;
  private colliders: Collider[] = [];
  private posterTex: THREE.Texture | null = null;
  private tmpV = new THREE.Vector3();
  private elapsed = 0;

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprint = true;
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.sprint = false;
  };
  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas || this.paused) return;
    this.addLook(e.movementX, e.movementY);
  };
  private onOrient = (e: DeviceOrientationEvent) => {
    if (!this.gyroOn) return;
    const alpha = e.alpha ?? 0; const beta = e.beta ?? 0; const gamma = e.gamma ?? 0;
    if (this.gyroBase === null) this.gyroBase = alpha;
    const rel = THREE.MathUtils.degToRad(alpha - (this.gyroBase ?? 0));
    this.gyroYaw = -rel;
    // pitch desde beta/gamma según orientación
    const landscape = Math.abs(gamma) > 45;
    const p = landscape ? THREE.MathUtils.degToRad(gamma - (gamma > 0 ? 90 : -90)) : THREE.MathUtils.degToRad(90 - beta);
    this.gyroPitch = THREE.MathUtils.clamp(-p, -1.2, 1.2);
  };
  private onResize = () => this.resize();

  constructor(canvas: HTMLCanvasElement, events: EngineEvents) {
    this.canvas = canvas;
    this.events = events;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.1, 900);
    this.camera.rotation.order = 'YXZ';

    this.scene.background = new THREE.Color(0x87bfe8);
    this.scene.fog = new THREE.Fog(0xcfe4f2, 90, 320);

    this.buildLights();
    this.buildSky();
    this.buildGround();
    this.buildBuilding();
    this.buildProps();
    this.buildCheckpoints();
    this.buildDust();

    try {
      const loader = new THREE.TextureLoader();
      loader.load(campusPoster, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        this.posterTex = t;
        this.applyPosters();
      });
    } catch { /* sin póster */ }

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('deviceorientation', this.onOrient);
    window.addEventListener('resize', this.onResize);
    this.resize();
  }

  // ---------- construcción del mundo ----------
  private buildLights() {
    const hemi = new THREE.HemisphereLight(0xbfdcff, 0xe8e0d0, 0.95);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.1);
    sun.position.set(-60, 90, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -110; sun.shadow.camera.right = 110;
    sun.shadow.camera.top = 110; sun.shadow.camera.bottom = -110;
    sun.shadow.camera.far = 300;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd6e9ff, 0.5);
    fill.position.set(60, 40, -60);
    this.scene.add(fill);
  }

  private buildSky() {
    // domo degradado
    const geo = new THREE.SphereGeometry(420, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x2f7fd0) }, mid: { value: new THREE.Color(0x9fd0f2) }, bot: { value: new THREE.Color(0xe8f3fa) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP; uniform vec3 top,mid,bot;
        void main(){ float h = normalize(vP).y; vec3 c = h>0.12 ? mix(mid,top,smoothstep(0.12,0.65,h)) : mix(bot,mid,smoothstep(-0.08,0.12,h));
        gl_FragColor = vec4(c,1.0); }`,
    });
    this.scene.add(new THREE.Mesh(geo, mat));
    // sol
    const { c, g } = makeCanvas(128, 128);
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,252,240,1)');
    grad.addColorStop(0.25, 'rgba(255,244,214,0.95)');
    grad.addColorStop(1, 'rgba(255,244,214,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    const sunTex = new THREE.CanvasTexture(c);
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false }));
    sun.position.set(-160, 190, 90); sun.scale.set(90, 90, 1);
    this.scene.add(sun);
    // nubes
    const ct = cloudTexture();
    for (let i = 0; i < 30; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, depthWrite: false, opacity: 0.75 + Math.random() * 0.25, fog: false }));
      const a = Math.random() * Math.PI * 2;
      const r = 180 + Math.random() * 160;
      s.position.set(Math.cos(a) * r, 90 + Math.random() * 90, Math.sin(a) * r);
      const sc = 50 + Math.random() * 70;
      s.scale.set(sc, sc * 0.45, 1);
      s.userData.speed = 0.6 + Math.random() * 1.4;
      this.scene.add(s);
      this.clouds.push(s);
    }
  }

  private buildGround() {
    const tex = concreteTexture();
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.96, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // franjas de pasto
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5da24a, roughness: 1 });
    const g1 = new THREE.Mesh(new THREE.PlaneGeometry(26, 120), grassMat);
    g1.rotation.x = -Math.PI / 2; g1.position.set(-78, 0.02, 10); g1.receiveShadow = true;
    this.scene.add(g1);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(20, 90), grassMat.clone());
    g2.rotation.x = -Math.PI / 2; g2.position.set(78, 0.02, 0); g2.receiveShadow = true;
    this.scene.add(g2);
    const g3 = new THREE.Mesh(new THREE.PlaneGeometry(120, 14), grassMat.clone());
    g3.rotation.x = -Math.PI / 2; g3.position.set(-20, 0.02, 62); g3.receiveShadow = true;
    this.scene.add(g3);

    // círculo de inicio
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 3.1, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.03, 46);
    this.scene.add(ring);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.14 })
    );
    disc.rotation.x = -Math.PI / 2; disc.position.set(0, 0.025, 46);
    this.scene.add(disc);
  }

  private white = new THREE.MeshStandardMaterial({ color: 0xf4f6f7, roughness: 0.85 });
  private glassMat = new THREE.MeshStandardMaterial({ color: 0x8fb8d4, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.55 });
  private darkMat = new THREE.MeshStandardMaterial({ color: 0x1e2732, roughness: 0.7 });
  private railMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.15 });
  private colMat = new THREE.MeshStandardMaterial({ color: 0xd9d4c7, roughness: 0.9 });

  private box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, shadow = true): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = shadow;
    this.scene.add(m);
    return m;
  }

  private buildBuilding() {
    // ===== Bloque principal norte (largo, sobre pilotis) =====
    const cx = 20, zc = -35, len = 116, dep = 14;
    // pilotis
    const colGeo = new THREE.CylinderGeometry(0.45, 0.5, 6.6, 12);
    for (let x = cx - len / 2 + 4; x <= cx + len / 2 - 2; x += 8) {
      for (const z of [zc - 5, zc, zc + 5]) {
        const col = new THREE.Mesh(colGeo, this.colMat);
        col.position.set(x, 3.3, z);
        col.castShadow = true; col.receiveShadow = true;
        this.scene.add(col);
      }
    }
    // losas + fachadas (3 niveles + cubierta)
    const floors = [7, 11.6, 16.2];
    for (const y of floors) {
      this.box(len, 0.55, dep, this.white, cx, y, zc);
      // muro posterior blanco
      this.box(len, 3.9, 0.5, this.white, cx, y + 2.2, zc - dep / 2 + 0.3);
      // vidrio frontal
      const gl = this.box(len - 3, 3.1, 0.25, this.glassMat, cx, y + 2.1, zc + dep / 2 - 0.6, false);
      gl.castShadow = false;
      // parteluces verticales
      for (let x = cx - len / 2 + 5; x < cx + len / 2 - 3; x += 6) {
        this.box(0.18, 3.1, 0.3, this.white, x, y + 2.1, zc + dep / 2 - 0.6, false);
      }
      // barandilla balcón
      this.box(len - 2, 0.12, 0.12, this.railMat, cx, y + 1.25, zc + dep / 2 + 0.9, false);
      this.box(len - 2, 0.1, 0.1, this.railMat, cx, y + 0.75, zc + dep / 2 + 0.9, false);
      for (let x = cx - len / 2 + 3; x < cx + len / 2 - 1; x += 4) {
        this.box(0.1, 1.25, 0.1, this.railMat, x, y + 0.62, zc + dep / 2 + 0.9, false);
      }
      // losa balcón
      this.box(len - 2, 0.18, 1.6, this.white, cx, y + 0.32, zc + dep / 2 + 0.5, false);
    }
    // cubierta + pérgola
    this.box(len + 1, 0.7, dep + 1.5, this.white, cx, 20.6, zc);
    this.box(len + 1, 1.0, 0.3, this.white, cx, 21.4, zc + dep / 2 + 0.6, false);
    for (let x = cx - len / 2 + 4; x < cx + len / 2; x += 8) {
      const beam = this.box(0.35, 0.35, dep + 3, this.white, x, 22.6, zc, false);
      beam.castShadow = true;
      this.box(0.22, 1.6, 0.22, this.white, x, 21.7, zc - dep / 2 - 0.5, false);
      this.box(0.22, 1.6, 0.22, this.white, x, 21.7, zc + dep / 2 + 0.5, false);
    }
    this.box(len, 0.12, dep + 3, this.glassMat, cx, 22.85, zc, false);
    // testeros
    this.box(0.8, 14.5, dep, this.white, cx - len / 2, 13.4, zc);
    this.box(0.8, 14.5, dep, this.white, cx + len / 2, 13.4, zc);
    // núcleo este (sólido en planta baja)
    this.box(9, 6.6, 12, this.white, 73, 3.3, zc);
    this.colliders.push({ minX: 68, maxX: 78, minZ: -41, maxZ: -29 });
    // vestíbulo / auditorio (fondo oscuro + puertas)
    this.box(20, 5.2, 1.2, this.darkMat, 9, 2.6, -38);
    this.box(20.6, 0.6, 2.4, this.white, 9, 5.6, -37.6);
    for (let x = 2; x <= 16; x += 3.5) {
      this.box(2.4, 3.4, 0.3, this.glassMat, x, 1.7, -37.2, false);
    }
    this.colliders.push({ minX: -1, maxX: 19, minZ: -39.5, maxZ: -36.5 });

    // ===== Ala oeste con rampas =====
    const wx = -45, wz = -5, ww = 18, wl = 46;
    for (let x = wx - ww / 2 + 2; x <= wx + ww / 2 - 1; x += 7) {
      for (let z = wz - wl / 2 + 3; z <= wz + wl / 2 - 2; z += 9) {
        const col = new THREE.Mesh(colGeo, this.colMat);
        col.position.set(x, 3.3, z);
        col.castShadow = true;
        this.scene.add(col);
      }
    }
    for (const y of floors) {
      this.box(ww, 0.55, wl, this.white, wx, y, wz);
      this.box(0.5, 3.9, wl, this.white, wx - ww / 2 + 0.3, y + 2.2, wz);
      const gl = this.box(0.25, 3.1, wl - 3, this.glassMat, wx + ww / 2 - 0.6, y + 2.1, wz, false);
      gl.castShadow = false;
      for (let z = wz - wl / 2 + 5; z < wz + wl / 2 - 3; z += 6) {
        this.box(0.3, 3.1, 0.18, this.white, wx + ww / 2 - 0.6, y + 2.1, z, false);
      }
      this.box(0.12, 0.12, wl - 2, this.railMat, wx + ww / 2 + 0.9, y + 1.25, wz, false);
      this.box(0.1, 0.1, wl - 2, this.railMat, wx + ww / 2 + 0.9, y + 0.75, wz, false);
    }
    this.box(ww + 0.6, 0.7, wl + 0.6, this.white, wx, 20.6, wz);
    this.box(ww, 1.0, 0.3, this.white, wx, 21.4, wz + wl / 2, false);
    // testero norte/sur ala
    this.box(ww, 14.5, 0.8, this.white, wx, 13.4, wz - wl / 2);
    this.box(ww, 14.5, 0.8, this.white, wx, 13.4, wz + wl / 2);
    // bodega planta baja oeste
    this.box(5, 5.4, 30, this.white, -52, 2.7, wz);
    this.colliders.push({ minX: -55, maxX: -49.2, minZ: wz - 15, maxZ: wz + 15 });

    // rampas en zigzag (este del ala)
    const rampX = wx + ww / 2 + 3.4;
    const levels: [number, number, number, number][] = [
      [0.4, 4.6, -16, 8], [4.6, 9.0, 8, -16], [9.0, 13.4, -16, 8], [13.4, 17.6, 8, -16],
    ];
    levels.forEach(([y0, y1, z0, z1]) => {
      const dz = z1 - z0, dy = y1 - y0;
      const L = Math.sqrt(dz * dz + dy * dy);
      const ang = Math.atan2(dy, Math.abs(dz)) * (dz > 0 ? -1 : 1);
      const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, L), this.white);
      ramp.position.set(rampX, (y0 + y1) / 2, (z0 + z1) / 2);
      ramp.rotation.x = ang;
      ramp.castShadow = true; ramp.receiveShadow = true;
      this.scene.add(ramp);
      // barandillas inclinadas
      for (const sx of [-1.5, 1.5]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, L), this.railMat);
        rail.position.set(rampX + sx, (y0 + y1) / 2 + 1.05, (z0 + z1) / 2);
        rail.rotation.x = ang;
        this.scene.add(rail);
      }
    });
    // apoyos rampas
    for (const z of [-16, -4, 8]) {
      this.box(0.5, 18, 0.5, this.colMat, rampX - 1.4, 9, z);
      this.box(0.5, 18, 0.5, this.colMat, rampX + 1.4, 9, z);
    }
  }

  private posterMeshes: THREE.Mesh[] = [];

  private buildProps() {
    // ---- autos low-poly bajo pilotis ----
    const carColors = [0xe8641e, 0xe8e8e8, 0xb9c2c9, 0xc22e2e, 0x2e5fc2];
    carColors.forEach((cc, i) => {
      const x = 30 + i * 7.5, z = -33 + (i % 2) * 5;
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.9), new THREE.MeshStandardMaterial({ color: cc, roughness: 0.4, metalness: 0.4 }));
      body.position.y = 0.75; body.castShadow = true;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 1.7), new THREE.MeshStandardMaterial({ color: 0x22303c, roughness: 0.2, metalness: 0.5 }));
      cab.position.set(-0.2, 1.5, 0); cab.castShadow = true;
      g.add(body, cab);
      const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 12);
      const wm = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
      [[-1.4, 0.95], [1.4, 0.95], [-1.4, -0.95], [1.4, -0.95]].forEach(([dx, dz]) => {
        const w = new THREE.Mesh(wg, wm);
        w.rotation.x = Math.PI / 2;
        w.position.set(dx, 0.36, dz);
        g.add(w);
      });
      g.position.set(x, 0, z);
      g.rotation.y = (i % 2 ? 0.06 : -0.05);
      this.scene.add(g);
      this.colliders.push({ minX: x - 2.4, maxX: x + 2.4, minZ: z - 1.4, maxZ: z + 1.4 });
    });

    // ---- árboles ----
    const trunkM = new THREE.MeshStandardMaterial({ color: 0x5a4230, roughness: 1 });
    const leafM = new THREE.MeshStandardMaterial({ color: 0x2e6b2e, roughness: 1 });
    const leafM2 = new THREE.MeshStandardMaterial({ color: 0x3f8a3f, roughness: 1 });
    const tree = (x: number, z: number, s: number) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.34 * s, 3.4 * s, 8), trunkM);
      trunk.position.y = 1.7 * s; trunk.castShadow = true;
      g.add(trunk);
      const blobs = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < blobs; i++) {
        const r = (1.4 + Math.random() * 1.1) * s;
        const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), i % 2 ? leafM : leafM2);
        b.position.set((Math.random() - 0.5) * 2.4 * s, (3.4 + Math.random() * 1.8) * s, (Math.random() - 0.5) * 2.4 * s);
        b.castShadow = true;
        g.add(b);
      }
      g.position.set(x, 0, z);
      this.scene.add(g);
      this.colliders.push({ minX: x - 0.5, maxX: x + 0.5, minZ: z - 0.5, maxZ: z + 0.5 });
    };
    for (let i = 0; i < 9; i++) tree(-72 - Math.random() * 8, -24 + i * 7 + Math.random() * 3, 1.1 + Math.random() * 0.7);
    for (let i = 0; i < 5; i++) tree(74 + Math.random() * 6, -18 + i * 9, 0.9 + Math.random() * 0.5);
    for (let i = 0; i < 4; i++) tree(-40 + i * 26, 66 + Math.random() * 4, 0.8 + Math.random() * 0.4);
    tree(-64, 40, 1.4); tree(-52, 22, 1.1);

    // ---- bancas ----
    const benchM = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.8 });
    const benchFrame = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6, metalness: 0.4 });
    const bench = (x: number, z: number, ry: number) => {
      const g = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.6), benchM);
      seat.position.y = 0.55; seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.1), benchM);
      back.position.set(0, 0.95, -0.3); back.castShadow = true;
      g.add(seat, back);
      for (const sx of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.6), benchFrame);
        leg.position.set(sx, 0.27, 0);
        g.add(leg);
      }
      g.position.set(x, 0, z); g.rotation.y = ry;
      this.scene.add(g);
    };
    bench(-8, 40, 0.3); bench(8, 38, -0.2); bench(-20, 20, 1.2); bench(24, 24, -1.1); bench(-40, -8, 0.8); bench(44, -12, -0.7);

    // ---- luminarias ----
    const poleM = new THREE.MeshStandardMaterial({ color: 0x444a50, roughness: 0.5, metalness: 0.6 });
    const lampM = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffedb0, emissiveIntensity: 0.9 });
    const lamp = (x: number, z: number) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 7, 8), poleM);
      pole.position.set(x, 3.5, z); pole.castShadow = true;
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.4), lampM);
      head.position.set(x, 7.05, z);
      this.scene.add(pole, head);
    };
    [[-14, 34], [14, 34], [-30, 0], [34, 0], [-10, -18], [30, -18], [-52, 30], [56, 22]].forEach(([x, z]) => lamp(x, z));

    // ---- vallas cartel con la foto del campus ----
    const billboard = (x: number, z: number, ry: number, w = 7, h = 4.4) => {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, h + 0.4, 0.25), new THREE.MeshStandardMaterial({ color: 0x10161d, roughness: 0.6 }));
      frame.position.y = h / 2 + 1.4; frame.castShadow = true;
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: 0x9fc3d8 })
      );
      screen.position.set(0, h / 2 + 1.4, 0.14);
      g.add(frame, screen);
      this.posterMeshes.push(screen);
      for (const sx of [-w / 3, w / 3]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8), poleM);
        leg.position.set(sx, 0.8, 0);
        g.add(leg);
      }
      g.position.set(x, 0, z); g.rotation.y = ry;
      this.scene.add(g);
    };
    billboard(-7, 43, Math.PI, 7, 4.4);
    billboard(8, -16, Math.PI * 0.08, 6, 3.8);
    billboard(52, 18, -Math.PI / 2.4, 6, 3.8);

    // ---- ciudad lejana + cerros ----
    const cityM = new THREE.MeshStandardMaterial({ color: 0xb9c6d2, roughness: 1 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const r = 150 + Math.random() * 40;
      const w = 8 + Math.random() * 16, h = 6 + Math.random() * 22, d = 8 + Math.random() * 12;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cityM);
      b.position.set(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r);
      this.scene.add(b);
    }
    const hillM = new THREE.MeshStandardMaterial({ color: 0x7d9b72, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const hill = new THREE.Mesh(new THREE.SphereGeometry(60 + Math.random() * 40, 16, 12), hillM);
      hill.scale.y = 0.24;
      hill.position.set(Math.cos(a) * 300, -4, Math.sin(a) * 300);
      this.scene.add(hill);
    }
  }

  private applyPosters() {
    if (!this.posterTex) return;
    this.posterMeshes.forEach((m) => {
      (m.material as THREE.MeshBasicMaterial).map = this.posterTex;
      (m.material as THREE.MeshBasicMaterial).color.set(0xffffff);
      (m.material as THREE.MeshBasicMaterial).needsUpdate = true;
    });
  }

  private buildCheckpoints() {
    CHECKPOINTS.forEach((cp, i) => {
      const g = new THREE.Group();
      g.position.set(cp.pos[0], 0, cp.pos[1]);
      const color = new THREE.Color(cp.color);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.3, 3.1, 48),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
      g.add(ring);

      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.7, 44, 20, 1, true),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })
      );
      beam.position.y = 22;
      g.add(beam);

      const orb = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.72, 0),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, roughness: 0.25, metalness: 0.4 })
      );
      orb.position.y = 2.3;
      g.add(orb);
      this.orbs.push(orb);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.06, 12, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
      );
      halo.position.y = 2.3;
      g.add(halo);
      this.halos.push(halo);

      const numTex = textSpriteTexture(cp.isFinish ? 'META' : `${i + 1}`, cp.name, `#${color.getHexString()}`);
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: numTex, transparent: true, depthWrite: false }));
      label.position.y = 4.6;
      label.scale.set(5.2, subScale(numTex), 1);
      g.add(label);

      const light = new THREE.PointLight(cp.color, 30, 22, 1.8);
      light.position.y = 3;
      g.add(light);

      // arco de meta
      if (cp.isFinish) {
        const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.35, metalness: 0.7 });
        for (const sx of [-3.4, 3.4]) {
          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.6, 12), gold);
          pillar.position.set(sx, 2.8, 0); pillar.castShadow = true;
          g.add(pillar);
        }
        const top = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.28, 12, 32, Math.PI), gold);
        top.position.y = 5.6; top.castShadow = true;
        g.add(top);
        const flagTex = textSpriteTexture('¡ META !', 'Cruza el arco dorado');
        const flag = new THREE.Sprite(new THREE.SpriteMaterial({ map: flagTex, transparent: true, depthWrite: false }));
        flag.position.y = 7.6; flag.scale.set(6, 1.9, 1);
        g.add(flag);
      }

      this.scene.add(g);
      this.cpGroups.push(g);
      this.cpMats.push({
        ring: ring.material as THREE.MeshBasicMaterial,
        beam: beam.material as THREE.MeshBasicMaterial,
        orb: orb.material as THREE.MeshStandardMaterial,
        label: label.material as THREE.SpriteMaterial,
        num: label.material as THREE.SpriteMaterial,
      });
    });
    this.refreshCheckpointStyles();
  }

  private refreshCheckpointStyles() {
    CHECKPOINTS.forEach((cp, i) => {
      const m = this.cpMats[i];
      const isDone = this.done[i];
      const isNext = i === this.current && !isDone;
      if (isDone) {
        m.ring.color.set(0x22c55e); m.ring.opacity = 0.7;
        m.beam.color.set(0x22c55e); m.beam.opacity = 0.1;
        m.orb.color.set(0x22c55e); m.orb.emissive.set(0x22c55e); m.orb.emissiveIntensity = 0.7;
        m.label.opacity = 0.55;
      } else if (isNext) {
        m.ring.color.set(cp.color); m.ring.opacity = 1;
        m.beam.color.set(cp.color); m.beam.opacity = 0.3;
        m.orb.color.set(cp.color); m.orb.emissive.set(cp.color); m.orb.emissiveIntensity = 1.6;
        m.label.opacity = 1;
      } else {
        m.ring.color.set(0x8b93a0); m.ring.opacity = 0.3;
        m.beam.color.set(0x8b93a0); m.beam.opacity = 0.07;
        m.orb.color.set(0x8b93a0); m.orb.emissive.set(0x555c66); m.orb.emissiveIntensity = 0.4;
        m.label.opacity = 0.4;
      }
    });
  }

  private buildDust() {
    const N = 350;
    const posArr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 180;
      posArr[i * 3 + 1] = 0.5 + Math.random() * 14;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.14, transparent: true, opacity: 0.55, depthWrite: false });
    this.dust = new THREE.Points(geo, mat);
    this.scene.add(this.dust);

    // confeti de victoria (oculto)
    const C = 900;
    const cpos = new Float32Array(C * 3);
    const cols = new Float32Array(C * 3);
    const palette = [new THREE.Color(0xf59e0b), new THREE.Color(0x22d3ee), new THREE.Color(0xa78bfa), new THREE.Color(0x34d399), new THREE.Color(0xf472b6)];
    this.confettiVel = new Float32Array(C * 3);
    for (let i = 0; i < C; i++) {
      cpos[i * 3] = 0; cpos[i * 3 + 1] = -50; cpos[i * 3 + 2] = -10;
      const p = palette[i % palette.length];
      cols[i * 3] = p.r; cols[i * 3 + 1] = p.g; cols[i * 3 + 2] = p.b;
      this.confettiVel[i * 3] = (Math.random() - 0.5) * 6;
      this.confettiVel[i * 3 + 1] = 4 + Math.random() * 8;
      this.confettiVel[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(cpos, 3));
    cgeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    this.finishConfetti = new THREE.Points(cgeo, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }));
    this.scene.add(this.finishConfetti);
  }

  celebrate() {
    this.celebrating = true;
    if (!this.finishConfetti) return;
    const meta = CHECKPOINTS[CHECKPOINTS.length - 1];
    const attr = this.finishConfetti.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i++) {
      attr.setXYZ(i, meta.pos[0] + (Math.random() - 0.5) * 6, 1 + Math.random() * 4, meta.pos[1] + (Math.random() - 0.5) * 6);
    }
    attr.needsUpdate = true;
  }

  // ---------- API pública ----------
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.vrMode ? (w / 2) / h : w / h;
    this.camera.updateProjectionMatrix();
  }

  requestLock() {
    if (document.pointerLockElement !== this.canvas) {
      try { this.canvas.requestPointerLock(); } catch { /* noop */ }
    }
  }
  exitLock() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  addLook(dx: number, dy: number) {
    if (this.paused) return;
    this.yaw -= dx * 0.0024;
    this.pitch -= dy * 0.0022;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.45, 1.45);
  }

  setJoystick(x: number, y: number) { this.joy.x = x; this.joy.y = y; }
  setVRWalk(v: boolean) { this.vrWalk = v; }
  setPaused(p: boolean) {
    this.paused = p;
    if (p) this.keys.clear();
  }

  setVR(on: boolean) {
    this.vrMode = on;
    this.resize();
  }

  async enableGyro(): Promise<boolean> {
    try {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res !== 'granted') return false;
      }
      this.gyroOn = true;
      this.gyroBase = null;
      return true;
    } catch {
      this.gyroOn = true;
      return true;
    }
  }
  disableGyro() { this.gyroOn = false; }

  reset() {
    this.pos.set(0, 1.7, 46);
    this.yaw = 0; this.pitch = 0;
    this.current = 0;
    this.done = CHECKPOINTS.map(() => false);
    this.celebrating = false;
    if (this.finishConfetti) {
      const attr = this.finishConfetti.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) attr.setY(i, -50);
      attr.needsUpdate = true;
    }
    this.refreshCheckpointStyles();
  }

  /** Marca el checkpoint actual como superado (lo llama la UI tras el quiz). */
  completeCurrent() {
    this.done[this.current] = true;
    if (this.current < CHECKPOINTS.length - 1) this.current += 1;
    this.refreshCheckpointStyles();
  }

  get locked() { return document.pointerLockElement === this.canvas; }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick();
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('deviceorientation', this.onOrient);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }

  // ---------- bucle ----------
  private collide(nx: number, nz: number): [number, number] {
    const r = 0.7;
    let x = THREE.MathUtils.clamp(nx, -102, 102);
    let z = THREE.MathUtils.clamp(nz, -102, 102);
    for (const c of this.colliders) {
      const cx = THREE.MathUtils.clamp(x, c.minX, c.maxX);
      const cz = THREE.MathUtils.clamp(z, c.minZ, c.maxZ);
      const dx = x - cx, dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          x = cx + (dx / d) * r;
          z = cz + (dz / d) * r;
        } else {
          // dentro: empujar por el eje más cercano
          const pushL = x - c.minX + r, pushR = c.maxX - x + r;
          const pushU = z - c.minZ + r, pushD = c.maxZ - z + r;
          const m = Math.min(pushL, pushR, pushU, pushD);
          if (m === pushL) x = c.minX - r;
          else if (m === pushR) x = c.maxX + r;
          else if (m === pushU) z = c.minZ - r;
          else z = c.maxZ + r;
        }
      }
    }
    return [x, z];
  }

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += dt;

    // --- movimiento ---
    let mx = 0, mz = 0;
    if (!this.paused) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz -= 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
      mx += this.joy.x;
      mz += -this.joy.y;
      if (this.vrWalk) mz += 1;
      const l = Math.hypot(mx, mz);
      if (l > 1) { mx /= l; mz /= l; }
    }
    const sprinting = (this.sprint || this.keys.has('ShiftLeft')) && mz > 0.1;
    const speed = sprinting ? 10.5 : 6.2;
    const moving = Math.hypot(mx, mz) > 0.08;

    // orientación efectiva (giroscopio en VR)
    let yaw = this.yaw, pitch = this.pitch;
    if (this.gyroOn && this.vrMode) {
      yaw = this.yaw + this.gyroYaw;
      pitch = THREE.MathUtils.clamp(this.gyroPitch, -1.2, 1.2);
    }
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const vx = (mx * cos - mz * sin) * speed;
    const vz = (-mz * cos - mx * sin) * speed;

    if (!this.paused && moving) {
      const [cx, cz] = this.collide(this.pos.x + vx * dt, this.pos.z + vz * dt);
      this.pos.x = cx; this.pos.z = cz;
      gameAudio.footstep(sprinting);
      // balanceo de cámara
      this.pos.y = 1.7 + Math.sin(this.elapsed * (sprinting ? 11 : 8)) * 0.045;
    } else {
      this.pos.y += (1.7 - this.pos.y) * Math.min(1, dt * 6);
    }
    this.speedSm += ((moving ? speed : 0) - this.speedSm) * Math.min(1, dt * 5);

    // --- checkpoint actual ---
    const cp = CHECKPOINTS[this.current];
    const dx = cp.pos[0] - this.pos.x;
    const dz = cp.pos[1] - this.pos.z;
    const dist = Math.hypot(dx, dz);
    const targetAngle = Math.atan2(-dx, -dz); // yaw que mira al objetivo
    let rel = targetAngle - yaw;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;

    // detección de llegada
    if (!this.paused && !this.done[this.current] && dist < 3.4) {
      this.events.onCheckpoint(this.current);
    }

    // --- animaciones ---
    this.orbs.forEach((o, i) => {
      o.rotation.y += dt * (1.4 + (i === this.current ? 1.2 : 0));
      o.rotation.x += dt * 0.5;
      o.position.y = 2.3 + Math.sin(this.elapsed * 2 + i * 1.3) * 0.28;
      const s = i === this.current && !this.done[i] ? 1 + Math.sin(this.elapsed * 5) * 0.12 : 1;
      o.scale.setScalar(s);
    });
    this.halos.forEach((h, i) => {
      h.rotation.x = this.elapsed * 0.9 + i;
      h.rotation.y = this.elapsed * 1.2;
      h.position.y = 2.3 + Math.sin(this.elapsed * 2 + i * 1.3) * 0.28;
    });
    this.cpGroups.forEach((grp, i) => {
      if (i === this.current && !this.done[i]) {
        const p = 0.5 + Math.sin(this.elapsed * 4) * 0.5;
        this.cpMats[i].beam.opacity = 0.24 + p * 0.14;
        grp.scale.set(1 + p * 0.02, 1, 1 + p * 0.02);
      } else {
        grp.scale.set(1, 1, 1);
      }
    });
    this.clouds.forEach((c) => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 340) c.position.x = -340;
    });
    if (this.dust) {
      this.dust.rotation.y += dt * 0.008;
      this.dust.position.y = Math.sin(this.elapsed * 0.4) * 0.4;
    }
    if (this.celebrating && this.finishConfetti && this.confettiVel) {
      const attr = this.finishConfetti.geometry.getAttribute('position') as THREE.BufferAttribute;
      const meta = CHECKPOINTS[CHECKPOINTS.length - 1];
      for (let i = 0; i < attr.count; i++) {
        let y = attr.getY(i);
        y += this.confettiVel[i * 3 + 1] * dt;
        let x = attr.getX(i) + this.confettiVel[i * 3] * dt;
        let z = attr.getZ(i) + this.confettiVel[i * 3 + 2] * dt;
        this.confettiVel[i * 3 + 1] -= 7 * dt;
        if (y < 0.1) {
          x = meta.pos[0] + (Math.random() - 0.5) * 8;
          z = meta.pos[1] + (Math.random() - 0.5) * 8;
          y = 6 + Math.random() * 5;
          this.confettiVel[i * 3 + 1] = 1 + Math.random() * 2;
        }
        attr.setXYZ(i, x, y, z);
      }
      attr.needsUpdate = true;
    }

    // --- cámara ---
    this.camera.position.copy(this.pos);
    this.camera.rotation.set(pitch, yaw, 0);

    // --- render ---
    if (this.vrMode) {
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      const half = Math.floor(w / 2);
      this.renderer.setScissorTest(true);
      // ojo izquierdo
      this.tmpV.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(-0.035);
      this.camera.position.copy(this.pos).add(this.tmpV);
      this.camera.aspect = half / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setViewport(0, 0, half, h);
      this.renderer.setScissor(0, 0, half, h);
      this.renderer.render(this.scene, this.camera);
      // ojo derecho
      this.tmpV.set(Math.cos(yaw), 0, -Math.sin(yaw)).multiplyScalar(0.035);
      this.camera.position.copy(this.pos).add(this.tmpV);
      this.renderer.setViewport(half, 0, w - half, h);
      this.renderer.setScissor(half, 0, w - half, h);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setScissorTest(false);
      this.camera.position.copy(this.pos);
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    this.events.onUpdate({
      x: this.pos.x, z: this.pos.z, yaw, pitch,
      speed: this.speedSm, moving,
      current: this.current, dist, angleToTarget: rel,
    });
  }
}

function subScale(_t: THREE.Texture) {
  return 1.65;
}
