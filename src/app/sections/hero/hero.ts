import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, NgZone,
  ChangeDetectionStrategy
} from '@angular/core';
import * as THREE from 'three';
import gsap from 'gsap';
import { ThreeService } from '../../services/three.service';

// ─── COORDENADAS DEL MUNDO ───────────────────────────────────────────────────
// La cámara está en el BORDE NORTE del cuenco (El Alto), mirando hacia el SUR.
// Y = altura  |  X = este-oeste  |  Z = norte-sur (+ = norte/cerca, - = sur/lejos)
//
// El Alto:       y ≈ -2,  z ≈ +12  (plano, detrás de la cámara)
// Borde cuenco:  y ≈ -2,  z ≈   0  (donde empiezan las laderas)
// Fondo cuenco:  y ≈ -12, z ≈  -6  (el centro más hundido)
// Illimani:      y enorme, z ≈ -45  (al sur, dominando el horizonte)

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('title', { static: true }) titleRef!: ElementRef;
  @ViewChild('sub', { static: true }) subRef!: ElementRef;
  @ViewChild('signal', { static: true }) signalRef!: ElementRef;
  @ViewChild('channel', { static: true }) channelRef!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mouse = { x: 0, y: 0 };
  private clock = new THREE.Clock();
  private gondolas: { mesh: THREE.Mesh; t: number; speed: number; curve: THREE.QuadraticBezierCurve3 }[] = [];
  private cityLights!: THREE.Points;
  private antennaMat!: THREE.MeshBasicMaterial;
  private glitchInterval!: ReturnType<typeof setInterval>;

  constructor(private threeService: ThreeService, private ngZone: NgZone) { }

  ngOnInit() {
    const { scene, camera, renderer } = this.threeService.init(this.canvasRef.nativeElement);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.setupScene();
    this.buildIllimani();
    this.buildBowlTerrain();
    this.buildCityLights();
    this.buildElAlto();
    this.buildTeleferico();
    this.buildStars();
    this.buildAtmosphere();
    this.setupMouseParallax();
    this.playIntro();
    this.startGlitch();
    this.startAntennaFlicker();

    this.threeService.startLoop(this.ngZone, () => this.render());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  private setupScene() {
    this.scene.background = new THREE.Color(0xE5E0D8); // Pergamino/Piedra
    this.scene.fog = new THREE.FogExp2(0xE5E0D8, 0.012);

    this.scene.add(new THREE.AmbientLight(0x717580, 2.5)); // Luz de día suave

    // Sol (Luz direccional cálida)
    const sunLight = new THREE.DirectionalLight(0xFFF5E1, 3.5);
    sunLight.position.set(10, 40, 20);
    this.scene.add(sunLight);

    // Resplandor cálido desde el cuenco simulando el rebote del sol
    const bowlBounce1 = new THREE.PointLight(0xF5E6D3, 1.5, 70);
    bowlBounce1.position.set(0, -5, -2);
    this.scene.add(bowlBounce1);

    const bowlBounce2 = new THREE.PointLight(0xE5D0B5, 1.0, 45);
    bowlBounce2.position.set(6, -7, 3);
    this.scene.add(bowlBounce2);

    // Luz dorada RTP desde El Alto
    // Luz bronce RTP desde El Alto
    const light = new THREE.PointLight(0xB8935A, 2, 35);

    light.position.set(-6, 3, -2);

    this.scene.add(light);

    // Camara: parada en el borde norte del cuenco (El Alto), mirando abajo y al sur
    this.camera.position.set(0, 14, 22);
    this.camera.lookAt(0, -6, -8);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ILLIMANI — montaña protagonista, enorme al fondo sur
  // ═══════════════════════════════════════════════════════════════════════════

  private buildIllimani() {

    // Construye una cumbre con: cuerpo principal + faldas + capa de nieve + glaciares
    const buildCumbre = (
      cx: number, cz: number,
      baseR: number, height: number,
      bodyColor: number, snowFraction: number // fraccion desde la cima donde empieza la nieve
    ) => {
      const root = new THREE.Group();
      // cy: base en el suelo del cuenco-ladera
      root.position.set(cx, -2, cz);

      // ── Cuerpo principal ──────────────────────────────────────────────────
      const bodyGeo = new THREE.ConeGeometry(baseR, height, 11);
      this.jitterGeo(bodyGeo, baseR * 0.20, 0.55);
      root.add(new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({
        color: bodyColor, flatShading: true, shininess: 5
      })));

      // ── Faldas/contrafuertes: 5 protuberancias en la base ─────────────────
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const sGeo = new THREE.ConeGeometry(baseR * 0.5, height * 0.48, 7);
        this.jitterGeo(sGeo, baseR * 0.16, 0.5);
        const sMesh = new THREE.Mesh(sGeo, new THREE.MeshPhongMaterial({
          color: new THREE.Color(bodyColor).multiplyScalar(0.72).getHex(),
          flatShading: true
        }));
        sMesh.position.set(
          Math.cos(ang) * baseR * 0.68,
          -height * 0.24,
          Math.sin(ang) * baseR * 0.68
        );
        root.add(sMesh);
      }

      // ── Capa de nieve (cono blanco-azulado) ───────────────────────────────
      const snowH = height * (1 - snowFraction);
      const snowR = baseR * (1 - snowFraction) * 1.15;
      const snowGeo = new THREE.ConeGeometry(snowR, snowH, 9);
      this.jitterGeo(snowGeo, snowR * 0.12, 0.3);
      const snowMesh = new THREE.Mesh(snowGeo, new THREE.MeshPhongMaterial({
        color: 0xd8e8f8, flatShading: true,
        emissive: 0x1a3d77, emissiveIntensity: 0.3,
        shininess: 80
      }));
      // Posicionar la nieve en la punta
      snowMesh.position.y = height * 0.5 - snowH * 0.5;
      root.add(snowMesh);

      // ── Glaciares: lenguas de hielo que bajan por las laderas ─────────────
      for (let g = 0; g < 4; g++) {
        const gAng = (g / 4) * Math.PI * 2 + 0.5;
        const gGeo = new THREE.ConeGeometry(snowR * 0.14, snowH * 0.65, 4);
        this.jitterGeo(gGeo, snowR * 0.05, 0.4);
        const gMesh = new THREE.Mesh(gGeo, new THREE.MeshPhongMaterial({
          color: 0x9fc4dd, flatShading: true
        }));
        gMesh.position.set(
          Math.cos(gAng) * snowR * 0.4,
          -snowH * 0.2,
          Math.sin(gAng) * snowR * 0.4
        );
        gMesh.rotation.z = Math.cos(gAng) * 0.35;
        gMesh.rotation.x = Math.sin(gAng) * 0.2;
        snowMesh.add(gMesh);
      }

      this.scene.add(root);
      return root;
    };

    // ── Las 4 cumbres del Illimani (Piedra y Nieve de día) ─────────────────
    buildCumbre(2, -48, 7, 28, 0x8D94A0, 0.56); // Pico Sur
    buildCumbre(-1, -46, 6, 24, 0x7A8290, 0.54); // Pico Central
    buildCumbre(-5, -44, 5, 20, 0x68707F, 0.52); // Pico Norte
    buildCumbre(6, -45, 5, 18, 0x727988, 0.50); // Cumbre secundaria

    // ── Cordillera de fondo: masa montanosa que enmarca el Illimani ───────────
    [
      { x: -18, z: -38, r: 10, h: 17 }, { x: 18, z: -38, r: 10, h: 16 },
      { x: -30, z: -30, r: 9, h: 14 }, { x: 30, z: -30, r: 9, h: 14 },
      { x: -11, z: -36, r: 8, h: 15 }, { x: 11, z: -36, r: 8, h: 15 },
      { x: 0, z: -54, r: 11, h: 13 }, { x: -24, z: -46, r: 8, h: 11 }, { x: 24, z: -46, r: 8, h: 11 },
    ].forEach(d => {
      const geo = new THREE.ConeGeometry(d.r, d.h, 8);
      this.jitterGeo(geo, d.r * 0.14, 0.5);
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: 0x5A5E68, flatShading: true
      }));
      mesh.position.set(d.x, -2, d.z);
      this.scene.add(mesh);
    });

    // ── Ladera que conecta la cordillera con el cuenco ────────────────────────
    const slopeGeo = new THREE.PlaneGeometry(80, 28, 32, 14);
    const slopePos = slopeGeo.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < slopePos.count; i++) {
      const py = slopePos.getY(i); // depth antes de rotar
      const t = (py + 14) / 28;  // 0 = borde lejano (z bajo), 1 = borde cercano (z alto)
      slopePos.setZ(i, 7 - t * 14 + (Math.random() - 0.5) * 1.2);
    }
    slopeGeo.computeVertexNormals();
    const slopeMesh = new THREE.Mesh(slopeGeo, new THREE.MeshPhongMaterial({
      color: 0x6E737D, flatShading: true, side: THREE.DoubleSide
    }));
    slopeMesh.rotation.x = -Math.PI / 2;
    slopeMesh.position.set(0, -2, -22);
    this.scene.add(slopeMesh);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOWL TERRAIN — la olla de La Paz
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBowlTerrain() {
    // Geometria del cuenco: el terreno se hunde en el centro y sube hacia los bordes.
    // Desde la camara (y=14, z=22 mirando a z=-8, y=-6):
    //   - Los bordes del cuenco (x=±18, z=0) aparecen ALTOS -> y cerca de -2
    //   - El fondo del cuenco (x=0, z=-6) esta MUY ABAJO -> y cerca de -12

    const SEGS = 55;
    const geo = new THREE.PlaneGeometry(56, 42, SEGS, SEGS);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;

    // Radio del cuenco (semi-ejes de la elipse paceña: mas ancho E-O que N-S)
    const RX = 20;
    const RZ = 16;
    const DEPTH = 10; // profundidad maxima del cuenco en Y

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i); // esto es Z del mundo antes de rotar el plano

      // Distancia normalizada al centro (0=centro, 1=borde del cuenco)
      const nx = px / RX;
      const nz = py / RZ;
      const r2 = Math.min(nx * nx + nz * nz, 1.4); // clamp para no crear picos

      // LA OLLA: el centro esta HUNDIDO, los bordes estan ALTOS.
      // borde (r2>=1) -> profundidad 0 -> y = -2 (nivel de El Alto)
      // centro (r2=0) -> profundidad maxima -> y = -2 - DEPTH = -12
      const depth = DEPTH * Math.max(0, 1 - r2);

      // Ruido de terreno: quebradas, calles en pendiente
      const noise =
        Math.sin(px * 0.7 + 0.3) * 0.35 +
        Math.sin(py * 1.0 + px * 0.4) * 0.28 +
        (Math.random() - 0.5) * 0.7;

      // Z en el plano horizontal = desplazamiento vertical del terreno
      // Borde: depth=0 -> z=0+noise (luego con position.y=-2 queda en y≈-2)
      // Centro: depth=DEPTH -> z=-DEPTH+noise (queda en y≈-12)
      pos.setZ(i, -depth + noise);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: 0x717580, flatShading: true, side: THREE.DoubleSide
    }));
    mesh.rotation.x = -Math.PI / 2;
    // y=-2: el borde del cuenco esta al mismo nivel que El Alto
    mesh.position.set(0, -2, -5);
    this.scene.add(mesh);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LUCES DE CIUDAD — la olla encendida de noche
  // ═══════════════════════════════════════════════════════════════════════════

  private buildCityLights() {
    const COUNT = 12000;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    // Mismos parametros que el terrain
    const RX = 19;
    const RZ = 15;
    const DEPTH = 10;
    // Centro del cuenco en el mundo
    const CENTER_Z = -5;

    for (let i = 0; i < COUNT; i++) {
      // Posicion angular aleatoria dentro del cuenco
      const angle = Math.random() * Math.PI * 2;
      // Distribucion: mas luces en las LADERAS que en el fondo absoluto
      const u = Math.random();
      // Radio 0-1: u^0.6 da mas densidad en la parte media (laderas)
      const normR = Math.pow(u, 0.55);

      const nx = Math.cos(angle) * normR;
      const nz = Math.sin(angle) * normR;

      const px = nx * RX;
      const pz = nz * RZ + CENTER_Z;

      // Altura: OLLA — el centro esta abajo, los bordes arriba
      const r2 = Math.min(nx * nx + nz * nz, 1.0);
      const depth = DEPTH * Math.max(0, 1 - r2);
      // y = borde(-2) - profundidad = mas abajo en el centro
      const py = -2 - depth + (Math.random() - 0.5) * 2.0;

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      // ── Paleta de colores por zona ────────────────────────────────────────
      const dist = Math.sqrt(r2);
      const rnd = Math.random();

      if (dist < 0.22) {
        // Fondo del cuenco: centro comercial, Sopocachi, El Prado
        // Mezcla de blanco-LED y amarillo
        if (rnd < 0.45) {
          col[i * 3] = 0.78 + Math.random() * 0.22; col[i * 3 + 1] = 0.88 + Math.random() * 0.12; col[i * 3 + 2] = 1.0;
        } else {
          col[i * 3] = 1.0; col[i * 3 + 1] = 0.92 + Math.random() * 0.08; col[i * 3 + 2] = 0.45 + Math.random() * 0.2;
        }
      } else if (dist < 0.6) {
        // Laderas medias — barrios residenciales, el color tipico de La Paz
        if (rnd < 0.55) {
          // SODIO NARANJA — el color mas iconico visto desde El Alto
          col[i * 3] = 1.0; col[i * 3 + 1] = 0.52 + Math.random() * 0.22; col[i * 3 + 2] = 0.04 + Math.random() * 0.08;
        } else if (rnd < 0.82) {
          // Amarillo calido residencial
          col[i * 3] = 1.0; col[i * 3 + 1] = 0.76 + Math.random() * 0.16; col[i * 3 + 2] = 0.22 + Math.random() * 0.18;
        } else {
          // LED azul-blanco moderno (edificios nuevos)
          col[i * 3] = 0.55; col[i * 3 + 1] = 0.75; col[i * 3 + 2] = 1.0;
        }
      } else {
        // Borde del cuenco / periferias / Villa Fatima / Max Paredes
        if (rnd < 0.65) {
          col[i * 3] = 1.0; col[i * 3 + 1] = 0.48 + Math.random() * 0.18; col[i * 3 + 2] = 0.04;
        } else {
          // Dorado: antenas, senales, torres RTP
          col[i * 3] = 0.9; col[i * 3 + 1] = 0.76; col[i * 3 + 2] = 0.02;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    this.cityLights = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true,
      opacity: 0.92, sizeAttenuation: true
    }));
    this.scene.add(this.cityLights);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EL ALTO — la meseta plana al norte (detras/debajo de la camara)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildElAlto() {
    const geo = new THREE.PlaneGeometry(95, 38, 28, 14);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, (Math.random() - 0.5) * 0.35);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: 0x828896, flatShading: true, side: THREE.DoubleSide
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -2.1, 11);
    this.scene.add(mesh);

    // Luces de El Alto — sodio anaranjado-rojizo, mas disperso que el cuenco
    const N = 3000;
    const lPos = new Float32Array(N * 3);
    const lCol = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      lPos[i * 3] = (Math.random() - 0.5) * 90;
      lPos[i * 3 + 1] = -1.85 + Math.random() * 0.35;
      lPos[i * 3 + 2] = 8 + (Math.random() - 0.5) * 35;

      // El Alto: sodio naranja-rojo dominante
      lCol[i * 3] = 1.0;
      lCol[i * 3 + 1] = 0.42 + Math.random() * 0.18;
      lCol[i * 3 + 2] = 0.02 + Math.random() * 0.05;
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
    this.scene.add(new THREE.Points(lGeo, new THREE.PointsMaterial({
      size: 0.065, vertexColors: true, transparent: true, opacity: 0.55
    })));

    // Antena RTP
    this.buildRTPAntenna();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELEFERICO
  // ═══════════════════════════════════════════════════════════════════════════

  private buildTeleferico() {
    // Los cables bajan desde el borde de El Alto (y=-2, z=+8)
    // hasta el fondo del cuenco (y=-9, z=-6) siguiendo la pendiente
    const lines = [
      {
        start: new THREE.Vector3(-15, -2, 9),
        ctrl: new THREE.Vector3(-11, -5, -1),
        end: new THREE.Vector3(-7, -9, -7),
        color: 0xDD2211, n: 5
      },
      {
        start: new THREE.Vector3(0, -2, 11),
        ctrl: new THREE.Vector3(1, -5, 1),
        end: new THREE.Vector3(3, -9, -5),
        color: 0xFFCC00, n: 4
      },
      {
        start: new THREE.Vector3(15, -2, 9),
        ctrl: new THREE.Vector3(11, -5, -1),
        end: new THREE.Vector3(8, -9, -7),
        color: 0x1155CC, n: 5
      },
    ];

    lines.forEach(l => {
      const curve = new THREE.QuadraticBezierCurve3(l.start, l.ctrl, l.end);
      const pts = curve.getPoints(40);
      const cGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(cGeo, new THREE.LineBasicMaterial({
        color: 0x3A4050, opacity: 0.85, transparent: true
      })));

      for (let g = 0; g < l.n; g++) {
        const gondola = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.25, 0.52),
          new THREE.MeshPhongMaterial({ color: l.color, emissive: l.color, emissiveIntensity: 0.4 })
        );
        gondola.position.copy(curve.getPoint(g / l.n));
        this.scene.add(gondola);
        this.gondolas.push({ mesh: gondola, t: g / l.n, speed: 0.0006 + Math.random() * 0.0003, curve });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANTENA RTP
  // ═══════════════════════════════════════════════════════════════════════════

  private buildRTPAntenna() {
    const g = new THREE.Group();
    g.position.set(-7, -2, 7); // en el borde de El Alto

    g.add(Object.assign(new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.055, 5.5, 5),
      new THREE.MeshPhongMaterial({ color: 0x223344 })
    )));

    [-2, -0.5, 1, 2.2].forEach(yo => {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 1.6, 4),
        new THREE.MeshPhongMaterial({ color: 0x223344 })
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.y = yo;
      g.add(arm);
    });

    this.antennaMat = new THREE.MeshBasicMaterial({ color: 0xFF2200 });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), this.antennaMat);
    tip.position.y = 2.85;
    g.add(tip);

    this.scene.add(g);
  }

  private startAntennaFlicker() {
    let on = true;
    setInterval(() => {
      on = !on;
      if (this.antennaMat) this.antennaMat.color.set(on ? 0xFF2200 : 0x3a0000);
    }, 900);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTÍCULAS / CENIZA (en vez de estrellas)
  // ═══════════════════════════════════════════════════════════════════════════

  private buildStars() {
    const N = 3500;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      // Distribuidas por todo el espacio cercano
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = 20 - Math.random() * 60;

      // Color ceniza/oro
      col[i * 3] = 0.9;
      col[i * 3 + 1] = 0.85 + Math.random() * 0.1;
      col[i * 3 + 2] = 0.7 + Math.random() * 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.18, vertexColors: true, transparent: true,
      opacity: 0.6, sizeAttenuation: true
    })));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATMOSFERA
  // ═══════════════════════════════════════════════════════════════════════════

  private buildAtmosphere() {
    // Brillo claro diurno en la base
    const glowGeo = new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.2, side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, -7, -5);
    this.scene.add(glow);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTRO
  // ═══════════════════════════════════════════════════════════════════════════

  private playIntro() {
    this.camera.position.set(0, 30, 52);
    this.camera.lookAt(0, -6, -8);

    const titleWrap = this.titleRef.nativeElement.closest('.hero__title-wrap') as HTMLElement;
    const subEl = this.subRef.nativeElement as HTMLElement;
    const signalEl = this.signalRef.nativeElement as HTMLElement;
    const channelEl = this.channelRef.nativeElement as HTMLElement;

    gsap.set([titleWrap, signalEl, channelEl], { opacity: 0 });
    gsap.set(subEl, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ delay: 0.3 });

    // Descenso de camara: como bajar en el teleferico desde El Alto
    tl.to(this.camera.position, { x: 0, y: 14, z: 22, duration: 5, ease: 'power2.inOut' });

    // Flash Canal 4
    tl.to(channelEl, { opacity: 1, duration: 0.08 }, 1.0);
    tl.to(channelEl, { opacity: 0, duration: 0.08 }, 1.7);
    tl.to(channelEl, { opacity: 1, duration: 0.08 }, 1.9);
    tl.to(channelEl, { opacity: 0, duration: 0.3 }, 2.5);

    // Titulo
    tl.to(titleWrap, { opacity: 1, duration: 0.06 }, 2.8);
    tl.from(this.titleRef.nativeElement, { y: 25, duration: 1.1, ease: 'power3.out' }, 2.8);

    // Subtitulo
    tl.to(subEl, { opacity: 0.8, y: 0, duration: 1, ease: 'power2.out' }, 3.6);

    // Signal
    tl.to(signalEl, { opacity: 1, duration: 0.8 }, 4.1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLITCH
  // ═══════════════════════════════════════════════════════════════════════════

  private startGlitch() {
    const el = this.titleRef.nativeElement as HTMLElement;
    this.glitchInterval = setInterval(() => {
      if (Math.random() > 0.65) return;
      el.classList.add('glitch-active');
      setTimeout(() => el.classList.remove('glitch-active'), 60 + Math.random() * 110);
    }, 2500 + Math.random() * 5000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOUSE PARALLAX
  // ═══════════════════════════════════════════════════════════════════════════

  private setupMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  private render() {
    // Gondolas se mueven por los cables
    this.gondolas.forEach(g => {
      g.t = (g.t + g.speed) % 1;
      g.mesh.position.copy(g.curve.getPoint(g.t));
    });

    // Parpadeo sutil de luces de ciudad (efecto de tension electrica)
    if (this.cityLights && Math.random() > 0.985) {
      (this.cityLights.material as THREE.PointsMaterial).opacity = 0.82 + Math.random() * 0.14;
    }

    // Parallax suave de camara
    this.camera.position.x += (this.mouse.x * 1.1 - this.camera.position.x) * 0.011;
    this.camera.position.y += (-this.mouse.y * 0.4 + 14 - this.camera.position.y) * 0.011;
    this.camera.lookAt(0, -6, -8);

    this.renderer.render(this.scene, this.camera);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILS
  // ═══════════════════════════════════════════════════════════════════════════

  private jitterGeo(geo: THREE.BufferGeometry, amount: number, threshold = 0.45) {
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < threshold) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * amount);
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * amount);
      }
    }
    geo.computeVertexNormals();
  }

  ngOnDestroy() {
    clearInterval(this.glitchInterval);
    this.threeService.destroy();
  }
}
