import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone, ChangeDetectionStrategy } from '@angular/core';
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
  @ViewChild('title', { static: true }) titleRef!: ElementRef;
  @ViewChild('sub', { static: true }) subRef!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private mouse = { x: 0, y: 0 };

  constructor(private threeService: ThreeService, private ngZone: NgZone) { }

  ngOnInit() {
    const { scene, camera, renderer } = this.threeService.init(this.canvasRef.nativeElement);
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.setupScene();
    this.createMountains();
    this.createParticles();
    this.createRobot();
    this.setupMouseParallax();
    this.playIntro();

    this.threeService.startLoop(this.ngZone, () => this.render());
  }

  private setupScene() {
    this.scene.fog = new THREE.FogExp2(0x050510, 0.025);
    this.scene.background = new THREE.Color(0x050510);

    this.scene.add(new THREE.AmbientLight(0x112244, 3));

    // Luz dorada desde arriba (sol andino)
    const sunLight = new THREE.DirectionalLight(0xE5C100, 2);
    sunLight.position.set(5, 20, 5);
    this.scene.add(sunLight);

    // Luz azul fría de la ciudad
    const cityLight = new THREE.PointLight(0x00BFFF, 4, 40);
    cityLight.position.set(0, -2, 6);
    this.scene.add(cityLight);

    // Luz naranja cálida lateral
    const warmLight = new THREE.PointLight(0xFF8800, 3, 30);
    warmLight.position.set(-8, 2, 3);
    this.scene.add(warmLight);

    this.camera.position.set(0, 4, 22);
    this.camera.lookAt(0, 2, 0);
  }

  private createMountains() {
    // ── ILLIMANI y cordillera de fondo ──────────────────────────
    const cordillera = [
      // Illimani central — el más alto e icónico
      { x: 0, y: -2, z: -12, sx: 10, sy: 18, sz: 10, color: 0x1a1a2e, snow: true, snowSize: 0.3 },
      // Picos secundarios del Illimani
      { x: 2.5, y: -2, z: -12, sx: 6, sy: 14, sz: 6, color: 0x16213e, snow: true, snowSize: 0.22 },
      { x: -2, y: -2, z: -12, sx: 5, sy: 12, sz: 5, color: 0x16213e, snow: true, snowSize: 0.18 },
      // Cordillera izquierda lejana
      { x: -10, y: -3, z: -14, sx: 7, sy: 11, sz: 7, color: 0x0f0f1a, snow: false, snowSize: 0 },
      { x: -16, y: -3, z: -14, sx: 6, sy: 9, sz: 6, color: 0x0d0d18, snow: false, snowSize: 0 },
      // Cordillera derecha lejana
      { x: 10, y: -3, z: -14, sx: 7, sy: 10, sz: 7, color: 0x0f0f1a, snow: false, snowSize: 0 },
      { x: 16, y: -3, z: -14, sx: 6, sy: 8, sz: 6, color: 0x0d0d18, snow: false, snowSize: 0 },
    ];

    cordillera.forEach(cfg => {
      const geo = new THREE.ConeGeometry(1, 1, 7 + Math.floor(Math.random() * 3));
      const pos = geo.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) < 0.45) {
          pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.3);
          pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.3);
        }
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
        color: cfg.color, flatShading: true
      }));
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.scale.set(cfg.sx, cfg.sy, cfg.sz);

      if (cfg.snow) {
        const snow = new THREE.Mesh(
          new THREE.ConeGeometry(cfg.snowSize, cfg.snowSize * 1.5, 5),
          new THREE.MeshPhongMaterial({
            color: 0xDDEEFF,
            flatShading: true,
            emissive: 0x334466,
            emissiveIntensity: 0.6
          })
        );
        snow.position.y = 0.52;
        mesh.add(snow);
      }

      this.scene.add(mesh);
    });

    // ── CUENCO DE LA PAZ — laderas ───────────────────────────────
    // La Paz está en un cañón/cuenco, las laderas bajan desde los bordes
    this.createLadera(-9, 1, 2, Math.PI * 0.08);   // ladera izquierda
    this.createLadera(9, 1, 2, -Math.PI * 0.08);   // ladera derecha
    this.createLadera(-6, 0, 4, Math.PI * 0.05);
    this.createLadera(6, 0, 4, -Math.PI * 0.05);

    // ── PISO DEL CUENCO — ciudad abajo ───────────────────────────
    this.createCityFloor();
  }

  private createLadera(x: number, y: number, z: number, rotZ: number) {
    // Ladera como plano inclinado con edificios encima
    const geo = new THREE.PlaneGeometry(8, 12, 4, 6);
    const pos = geo.attributes['position'] as THREE.BufferAttribute;

    // Deformar para terreno irregular
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.4);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhongMaterial({
      color: 0x1a1005,
      flatShading: true,
      side: THREE.FrontSide
    });

    const ladera = new THREE.Mesh(geo, mat);
    ladera.position.set(x, y, z);
    ladera.rotation.x = -Math.PI * 0.3;
    ladera.rotation.z = rotZ;
    this.scene.add(ladera);

    // Edificios en la ladera
    this.createBuildingsOnLadera(x, y, z, rotZ);
  }

  private createBuildingsOnLadera(baseX: number, baseY: number, baseZ: number, rotZ: number) {
    const count = 18;
    const direction = rotZ > 0 ? -1 : 1;

    for (let i = 0; i < count; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const h = 0.15 + Math.random() * 0.4;
      const w = 0.12 + Math.random() * 0.15;

      const geo = new THREE.BoxGeometry(w, h, w * 0.8);
      const isLit = Math.random() > 0.4;

      const mat = new THREE.MeshPhongMaterial({
        color: isLit ? 0x2a1f0a : 0x151510,
        emissive: isLit ? 0xFF8800 : 0x000000,
        emissiveIntensity: isLit ? 0.15 + Math.random() * 0.2 : 0,
        flatShading: true
      });

      const building = new THREE.Mesh(geo, mat);

      // Posicionar en la ladera con perspectiva de cuenco
      const spreadX = direction * (col * 0.9 + Math.random() * 0.4);
      const spreadY = row * 0.8 + Math.random() * 0.3;

      building.position.set(
        baseX + spreadX * 0.8,
        baseY - 1 + spreadY * 0.6,
        baseZ + row * 0.5 - 1
      );
      building.rotation.z = rotZ * 0.5;

      this.scene.add(building);
    }
  }

  private createCityFloor() {
    // Piso plano del centro de La Paz
    const floorGeo = new THREE.PlaneGeometry(14, 8, 1, 1);
    const floorMat = new THREE.MeshPhongMaterial({
      color: 0x0a0a15,
      flatShading: true
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -3.5, 3);
    this.scene.add(floor);

    // Edificios del centro — más altos
    const centerBuildings = [
      { x: -2, z: 1, h: 1.2, w: 0.5 },
      { x: -1, z: 0, h: 1.8, w: 0.4 },
      { x: 0, z: 0, h: 2.2, w: 0.6 },
      { x: 1, z: 0, h: 1.6, w: 0.4 },
      { x: 2, z: 1, h: 1.0, w: 0.45 },
      { x: -1.5, z: 2, h: 0.8, w: 0.35 },
      { x: 0.5, z: 2, h: 0.9, w: 0.38 },
      { x: 2.5, z: 0, h: 1.3, w: 0.42 },
      { x: -2.5, z: 0, h: 1.1, w: 0.4 },
      { x: 1.5, z: 1.5, h: 0.7, w: 0.3 },
    ];

    centerBuildings.forEach(cfg => {
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.w * 0.9);
      const isLit = Math.random() > 0.3;
      const mat = new THREE.MeshPhongMaterial({
        color: 0x151520,
        emissive: isLit ? 0x00BFFF : 0xFF8800,
        emissiveIntensity: 0.08 + Math.random() * 0.15,
        flatShading: true
      });
      const b = new THREE.Mesh(geo, mat);
      b.position.set(cfg.x, -3.5 + cfg.h / 2, cfg.z);
      this.scene.add(b);
    });
  }


  private createParticles() {
    const count = 3000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      const gold = Math.random() > 0.5;
      col[i * 3] = gold ? 0.9 : 0.0;
      col[i * 3 + 1] = gold ? 0.75 : 0.75;
      col[i * 3 + 2] = gold ? 0.0 : 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.08, vertexColors: true, transparent: true, opacity: 0.5
    }));
    this.scene.add(this.particles);
  }

  private playIntro() {
    const titleWrap = this.titleRef.nativeElement.parentElement;

    // Cámara empieza lejos y se acerca
    const camStart = { z: 40, y: 8 };
    this.camera.position.z = camStart.z;
    this.camera.position.y = camStart.y;

    const tl = gsap.timeline({ delay: 0.5 });

    // 1. Cámara se acerca lentamente
    tl.to(this.camera.position, {
      z: 18, y: 3,
      duration: 3.5,
      ease: 'power2.inOut'
    });

    // 2. Título aparece con fade + slide
    tl.to(titleWrap, {
      opacity: 1,
      duration: 1.2,
      ease: 'power2.out'
    }, '-=1');

    tl.from(this.titleRef.nativeElement, {
      y: 30,
      duration: 1.2,
      ease: 'power3.out'
    }, '<');

    tl.from(this.subRef.nativeElement, {
      y: 15,
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.6');

    // 3. Robot desciende del cielo
    tl.to(this.robotGroup.position, {
      y: 0.5,
      duration: 2.5,
      ease: 'power3.inOut'
    }, '-=0.5');

    tl.to(this.robotGroup.rotation, {
      y: Math.PI * 0.15,
      duration: 2.5,
      ease: 'power2.out'
    }, '<');
  }

  private setupMouseParallax() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  private render() {
    this.particles.rotation.y += 0.0002;
    this.camera.position.x += (this.mouse.x * 1.5 - this.camera.position.x) * 0.02;
    // parallax Y solo después del intro
    this.camera.lookAt(0, 2, 0);
    this.renderer.render(this.scene, this.camera);
    if (this.robotGroup) {
      this.robotGroup.position.y = 0.5 + Math.sin(Date.now() * 0.001) * 0.15;
    }
  }

  ngOnDestroy() {
    this.threeService.destroy();
  }


  private robotGroup!: THREE.Group;

  private createRobot() {
    this.robotGroup = new THREE.Group();

    const metalMat = new THREE.MeshPhongMaterial({
      color: 0x223344, flatShading: true, shininess: 80
    });
    const goldMat = new THREE.MeshPhongMaterial({
      color: 0xE5C100, flatShading: true,
      emissive: 0xE5C100, emissiveIntensity: 0.3
    });
    const reactorMat = new THREE.MeshPhongMaterial({
      color: 0x00BFFF,
      emissive: 0x00BFFF,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9
    });

    // Cuerpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.7), metalMat);
    this.robotGroup.add(body);

    // Pecho reactor
    const reactor = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), reactorMat);
    reactor.position.set(0, 0.1, 0.36);
    this.robotGroup.add(reactor);

    // Hombros
    [-0.85, 0.85].forEach(x => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 6), metalMat);
      shoulder.position.set(x, 0.6, 0);
      this.robotGroup.add(shoulder);

      // Brazos
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 1.0, 6), metalMat);
      arm.position.set(x, -0.1, 0);
      this.robotGroup.add(arm);

      // Detalles dorados en hombros
      const detail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.35), goldMat);
      detail.position.set(x, 0.6, 0);
      this.robotGroup.add(detail);
    });

    // Cabeza
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.65), metalMat);
    head.position.y = 1.2;
    this.robotGroup.add(head);

    // Visera
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.18, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x00BFFF, emissive: 0x00BFFF, emissiveIntensity: 2 })
    );
    visor.position.set(0, 1.22, 0.33);
    this.robotGroup.add(visor);

    // Antena
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4), goldMat);
    antenna.position.set(0.2, 1.75, 0);
    this.robotGroup.add(antenna);

    const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), reactorMat);
    antennaTip.position.set(0.2, 2.02, 0);
    this.robotGroup.add(antennaTip);

    // Piernas
    [-0.3, 0.3].forEach(x => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 1.1, 6), metalMat);
      leg.position.set(x, -1.3, 0);
      this.robotGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.5), metalMat);
      foot.position.set(x, -1.92, 0.08);
      this.robotGroup.add(foot);
    });

    // Luz del reactor
    const reactorLight = new THREE.PointLight(0x00BFFF, 3, 4);
    reactorLight.position.set(0, 0.1, 1);
    this.robotGroup.add(reactorLight);

    // Posición inicial: arriba del cielo
    this.robotGroup.position.set(0, 25, 2);
    this.robotGroup.scale.setScalar(0.8);
    this.scene.add(this.robotGroup);
  }
}
