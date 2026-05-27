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
    this.scene.fog = new THREE.FogExp2(0x0A0A0A, 0.035);
    this.scene.background = new THREE.Color(0x0A0A0A);

    this.scene.add(new THREE.AmbientLight(0x112244, 4));

    const goldLight = new THREE.PointLight(0xE5C100, 8, 60);
    goldLight.position.set(0, 10, 5);
    this.scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x00BFFF, 5, 40);
    blueLight.position.set(-10, 5, 0);
    this.scene.add(blueLight);

    this.camera.position.set(0, 3, 18);
    this.camera.lookAt(0, 4, 0);
  }

  private createMountains() {
    const configs = [
      { x: 0, y: -4, z: 0, sx: 8, sy: 14, sz: 8, color: 0x1a1a2e, snow: true },
      { x: -12, y: -4, z: -5, sx: 6, sy: 10, sz: 6, color: 0x16213e, snow: true },
      { x: -7, y: -4, z: 2, sx: 5, sy: 8, sz: 5, color: 0x12122a, snow: false },
      { x: 11, y: -4, z: -5, sx: 6, sy: 10, sz: 6, color: 0x16213e, snow: true },
      { x: 7, y: -4, z: 2, sx: 5, sy: 7, sz: 5, color: 0x12122a, snow: false },
      { x: -18, y: -4, z: -12, sx: 7, sy: 9, sz: 7, color: 0x0d0d1a, snow: false },
      { x: 18, y: -4, z: -12, sx: 7, sy: 9, sz: 7, color: 0x0d0d1a, snow: false },
      { x: 4, y: -4, z: -15, sx: 9, sy: 11, sz: 9, color: 0x0f0f1a, snow: false },
      { x: -4, y: -4, z: -15, sx: 8, sy: 10, sz: 8, color: 0x0f0f1a, snow: false },
    ];

    configs.forEach(cfg => {
      const geo = new THREE.ConeGeometry(1, 1, 7);
      const pos = geo.attributes['position'] as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        if (pos.getY(i) < 0.45) {
          pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.25);
          pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.25);
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
          new THREE.ConeGeometry(0.22, 0.35, 5),
          new THREE.MeshPhongMaterial({ color: 0xCCDDFF, flatShading: true, emissive: 0x334466, emissiveIntensity: 0.5 })
        );
        snow.position.y = 0.52;
        mesh.add(snow);
      }

      this.scene.add(mesh);
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
