import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, NgZone,
  ChangeDetectionStrategy
} from '@angular/core';
import * as THREE from 'three';
import gsap from 'gsap';
import { ThreeService } from '../../services/three.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('title',  { static: true }) titleRef!:  ElementRef;
  @ViewChild('sub',    { static: true }) subRef!:    ElementRef;
  @ViewChild('signal', { static: true }) signalRef!: ElementRef;
  @ViewChild('channel',{ static: true }) channelRef!:ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mouse = { x: 0, y: 0 };
  private gondolas: { mesh: THREE.Mesh; t: number; speed: number; curve: THREE.QuadraticBezierCurve3 }[] = [];
  private cityLights!: THREE.Points;
  private antennaMat!: THREE.MeshBasicMaterial;

  // ── Stored handles for proper cleanup ──────────────────────────────────────
  private glitchInterval!:  ReturnType<typeof setInterval>;
  private antennaInterval!: ReturnType<typeof setInterval>;
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private resizeHandler!:    () => void;

  constructor(private threeService: ThreeService, private ngZone: NgZone) {}

  ngOnInit() {
    const { scene, camera, renderer } = this.threeService.init(this.canvasRef.nativeElement);
    this.scene    = scene;
    this.camera   = camera;
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
    this.setupResize();       // ← NEW: handle canvas resize
    this.playIntro();
    this.startGlitch();
    this.startAntennaFlicker();

    this.threeService.startLoop(this.ngZone, () => this.render());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  private setupScene() {
    this.scene.background = new THREE.Color(0xE5E0D8);
    this.scene.fog = new THREE.FogExp2(0xE5E0D8, 0.012);

    this.scene.add(new THREE.AmbientLight(0x717580, 2.5));

    const sunLight = new THREE.DirectionalLight(0xFFF5E1, 3.5);
    sunLight.position.set(10, 40, 20);
    this.scene.add(sunLight);

    const bowlBounce1 = new THREE.PointLight(0xF5E6D3, 1.5, 70);
    bowlBounce1.position.set(0, -5, -2);
    this.scene.add(bowlBounce1);

    const bowlBounce2 = new THREE.PointLight(0xE5D0B5, 1.0, 45);
    bowlBounce2.position.set(6, -7, 3);
    this.scene.add(bowlBounce2);

    const light = new THREE.PointLight(0xB8935A, 2, 35);
    light.position.set(-6, 3, -2);
    this.scene.add(light);

    this.camera.position.set(0, 14, 22);
    this.camera.lookAt(0, -6, -8);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ILLIMANI
  // ═══════════════════════════════════════════════════════════════════════════

  private buildIllimani() {
    const buildCumbre = (
      cx: number, cz: number,
      baseR: number, height: number,
      bodyColor: number, snowFraction: number
    ) => {
      const root = new THREE.Group();
      root.position.set(cx, -2, cz);

      const bodyGeo = new THREE.ConeGeometry(baseR, height, 11);
      this.jitterGeo(bodyGeo, baseR * 0.20, 0.55);
      root.add(new THREE.Mesh(bodyGeo, new THREE.MeshPhongMaterial({
        color: bodyColor, flatShading: true, shininess: 5
      })));

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

      const snowH = height * (1 - snowFraction);
      const snowR = baseR * (1 - snowFraction) * 1.15;
      const snowGeo = new THREE.ConeGeometry(snowR, snowH, 9);
      this.jitterGeo(snowGeo, snowR * 0.12, 0.3);
      const snowMesh = new THREE.Mesh(snowGeo, new THREE.MeshPhongMaterial({
        color: 0xd8e8f8, flatShading: true,
        emissive: 0x1a3d77, emissiveIntensity: 0.3, shininess: 80
      }));
      snowMesh.position.y = height * 0.5 - snowH * 0.5;
      root.add(snowMesh);

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

    buildCumbre(2,  -48, 7, 28, 0x8D94A0, 0.56);
    buildCumbre(-1, -46, 6, 24, 0x7A8290, 0.54);
    buildCumbre(-5, -44, 5, 20, 0x68707F, 0.52);
    buildCumbre(6,  -45, 5, 18, 0x727988, 0.50);

    [
      { x: -18, z: -38, r: 10, h: 17 }, { x: 18, z: -38, r: 10, h: 16 },
      { x: -30, z: -30, r: 9,  h: 14 }, { x: 30, z: -30, r: 9,  h: 14 },
      { x: -11, z: -36, r: 8,  h: 15 }, { x: 11, z: -36, r: 8,  h: 15 },
      { x: 0,   z: -54, r: 11, h: 13 }, { x: -24, z: -46, r: 8, h: 11 }, { x: 24, z: -46, r: 8, h: 11 },
    ].forEach(d => {
      const geo = new THREE.ConeGeometry(d.r, d.h, 8);
      this.jitterGeo(geo, d.r * 0.14, 0.5);
      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: 0x5A5E68, flatShading: true
      }));
      mesh.position.set(d.x, -2, d.z);
      this.scene.add(mesh);
    });

    const slopeGeo = new THREE.PlaneGeometry(80, 28, 32, 14);
    const slopePos = slopeGeo.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < slopePos.count; i++) {
      const py = slopePos.getY(i);
      const t = (py + 14) / 28;
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
  // BOWL TERRAIN
  // ═══════════════════════════════════════════════════════════════════════════

  private buildBowlTerrain() {
    const SEGS = 55;
    const geo = new THREE.PlaneGeometry(56, 42, SEGS, SEGS);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    const RX = 20, RZ = 16, DEPTH = 10;

    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const nx = px / RX, nz = py / RZ;
      const r2 = Math.min(nx * nx + nz * nz, 1.4);
      const depth = DEPTH * Math.max(0, 1 - r2);
      const noise =
        Math.sin(px * 0.7 + 0.3) * 0.35 +
        Math.sin(py * 1.0 + px * 0.4) * 0.28 +
        (Math.random() - 0.5) * 0.7;
      pos.setZ(i, -depth + noise);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: 0x717580, flatShading: true, side: THREE.DoubleSide
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -2, -5);
    this.scene.add(mesh);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CITY LIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  private buildCityLights() {
    const COUNT = 12000;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const RX = 19, RZ = 15, DEPTH = 10, CENTER_Z = -5;

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const normR = Math.pow(Math.random(), 0.55);
      const nx = Math.cos(angle) * normR;
      const nz = Math.sin(angle) * normR;
      const r2 = Math.min(nx * nx + nz * nz, 1.0);
      const depth = DEPTH * Math.max(0, 1 - r2);

      pos[i * 3]     = nx * RX;
      pos[i * 3 + 1] = -2 - depth + (Math.random() - 0.5) * 2.0;
      pos[i * 3 + 2] = nz * RZ + CENTER_Z;

      const dist = Math.sqrt(r2);
      const rnd  = Math.random();

      if (dist < 0.22) {
        if (rnd < 0.45) {
          col[i*3]=0.78+Math.random()*0.22; col[i*3+1]=0.88+Math.random()*0.12; col[i*3+2]=1.0;
        } else {
          col[i*3]=1.0; col[i*3+1]=0.92+Math.random()*0.08; col[i*3+2]=0.45+Math.random()*0.2;
        }
      } else if (dist < 0.6) {
        if (rnd < 0.55) {
          col[i*3]=1.0; col[i*3+1]=0.52+Math.random()*0.22; col[i*3+2]=0.04+Math.random()*0.08;
        } else if (rnd < 0.82) {
          col[i*3]=1.0; col[i*3+1]=0.76+Math.random()*0.16; col[i*3+2]=0.22+Math.random()*0.18;
        } else {
          col[i*3]=0.55; col[i*3+1]=0.75; col[i*3+2]=1.0;
        }
      } else {
        if (rnd < 0.65) {
          col[i*3]=1.0; col[i*3+1]=0.48+Math.random()*0.18; col[i*3+2]=0.04;
        } else {
          col[i*3]=0.9; col[i*3+1]=0.76; col[i*3+2]=0.02;
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this.cityLights = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.1, vertexColors: true, transparent: true, opacity: 0.92, sizeAttenuation: true
    }));
    this.scene.add(this.cityLights);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EL ALTO
  // ═══════════════════════════════════════════════════════════════════════════

  private buildElAlto() {
    const geo = new THREE.PlaneGeometry(95, 38, 28, 14);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, (Math.random() - 0.5) * 0.35);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
      color: 0x828896, flatShading: true, side: THREE.DoubleSide
    }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -2.1, 11);
    this.scene.add(mesh);

    const N = 3000;
    const lPos = new Float32Array(N * 3);
    const lCol = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      lPos[i*3]   = (Math.random() - 0.5) * 90;
      lPos[i*3+1] = -1.85 + Math.random() * 0.35;
      lPos[i*3+2] = 8 + (Math.random() - 0.5) * 35;
      lCol[i*3]   = 1.0;
      lCol[i*3+1] = 0.42 + Math.random() * 0.18;
      lCol[i*3+2] = 0.02 + Math.random() * 0.05;
    }
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(lPos, 3));
    lGeo.setAttribute('color',    new THREE.BufferAttribute(lCol, 3));
    this.scene.add(new THREE.Points(lGeo, new THREE.PointsMaterial({
      size: 0.065, vertexColors: true, transparent: true, opacity: 0.55
    })));

    this.buildRTPAntenna();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELEFERICO
  // ═══════════════════════════════════════════════════════════════════════════

  private buildTeleferico() {
    const lines = [
      { start: new THREE.Vector3(-15,-2,9),  ctrl: new THREE.Vector3(-11,-5,-1), end: new THREE.Vector3(-7,-9,-7),  color: 0xDD2211, n: 5 },
      { start: new THREE.Vector3(0,  -2,11), ctrl: new THREE.Vector3(1,  -5, 1), end: new THREE.Vector3(3, -9,-5),  color: 0xFFCC00, n: 4 },
      { start: new THREE.Vector3(15, -2,9),  ctrl: new THREE.Vector3(11, -5,-1), end: new THREE.Vector3(8, -9,-7),  color: 0x1155CC, n: 5 },
    ];

    lines.forEach(l => {
      const curve = new THREE.QuadraticBezierCurve3(l.start, l.ctrl, l.end);
      const pts = curve.getPoints(40);
      const cGeo = new THREE.BufferGeometry().setFromPoints(pts);
      this.scene.add(new THREE.Line(cGeo, new THREE.LineBasicMaterial({ color: 0x3A4050, opacity: 0.85, transparent: true })));

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
    g.position.set(-7, -2, 7);

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
    // Store the handle so we can clear it in ngOnDestroy
    this.antennaInterval = setInterval(() => {
      on = !on;
      if (this.antennaMat) this.antennaMat.color.set(on ? 0xFF2200 : 0x3a0000);
    }, 900);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STARS / ATMOSPHERE
  // ═══════════════════════════════════════════════════════════════════════════

  private buildStars() {
    const N = 3500;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 60;
      pos[i*3+1] = (Math.random() - 0.5) * 40;
      pos[i*3+2] = 20 - Math.random() * 60;
      col[i*3]   = 0.9;
      col[i*3+1] = 0.85 + Math.random() * 0.1;
      col[i*3+2] = 0.7  + Math.random() * 0.2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.18, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true
    })));
  }

  private buildAtmosphere() {
    const glowGeo = new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const glow = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      color: 0xFFFFFF, transparent: true, opacity: 0.2, side: THREE.BackSide
    }));
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
    const subEl     = this.subRef.nativeElement     as HTMLElement;
    const signalEl  = this.signalRef.nativeElement  as HTMLElement;
    const channelEl = this.channelRef.nativeElement as HTMLElement;

    gsap.set([titleWrap, signalEl, channelEl], { opacity: 0 });
    gsap.set(subEl, { opacity: 0, y: 20 });

    const tl = gsap.timeline({ delay: 0.3 });

    tl.to(this.camera.position, { x: 0, y: 14, z: 22, duration: 5, ease: 'power2.inOut' });

    tl.to(channelEl, { opacity: 1, duration: 0.08 }, 1.0);
    tl.to(channelEl, { opacity: 0, duration: 0.08 }, 1.7);
    tl.to(channelEl, { opacity: 1, duration: 0.08 }, 1.9);
    tl.to(channelEl, { opacity: 0, duration: 0.3  }, 2.5);

    tl.to(titleWrap, { opacity: 1, duration: 0.06 }, 2.8);
    tl.from(this.titleRef.nativeElement, { y: 25, duration: 1.1, ease: 'power3.out' }, 2.8);
    tl.to(subEl,    { opacity: 0.8, y: 0, duration: 1, ease: 'power2.out' }, 3.6);
    tl.to(signalEl, { opacity: 1,          duration: 0.8 }, 4.1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GLITCH
  // ═══════════════════════════════════════════════════════════════════════════

  private startGlitch() {
    const el = this.titleRef.nativeElement as HTMLElement;

    // FIX: data-text is required by the CSS ::before/::after attr(data-text)
    // Set it once here so it stays in sync with the element's text content
    el.setAttribute('data-text', el.textContent?.trim() ?? '');

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
    // Store the bound function so we can removeEventListener later
    this.mouseMoveHandler = (e: MouseEvent) => {
      this.mouse.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESIZE — keeps camera aspect + renderer size correct
  // ═══════════════════════════════════════════════════════════════════════════

  private setupResize() {
    this.resizeHandler = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  private render() {
    this.gondolas.forEach(g => {
      g.t = (g.t + g.speed) % 1;
      g.mesh.position.copy(g.curve.getPoint(g.t));
    });

    if (this.cityLights && Math.random() > 0.985) {
      (this.cityLights.material as THREE.PointsMaterial).opacity = 0.82 + Math.random() * 0.14;
    }

    this.camera.position.x += (this.mouse.x * 1.1    - this.camera.position.x) * 0.011;
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

  // ═══════════════════════════════════════════════════════════════════════════
  // DESTROY — clean up ALL listeners and intervals
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnDestroy() {
    clearInterval(this.glitchInterval);
    clearInterval(this.antennaInterval);                            // ← was missing
    window.removeEventListener('mousemove', this.mouseMoveHandler); // ← was missing
    window.removeEventListener('resize',    this.resizeHandler);    // ← was missing
    this.threeService.destroy();
  }
}
