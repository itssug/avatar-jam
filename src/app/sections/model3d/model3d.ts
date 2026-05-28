import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, NgZone, ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ScrollService } from '../../services/scroll.service';
import { Subscription } from 'rxjs';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-model3d',
  standalone: true,
  imports: [],
  templateUrl: './model3d.html',
  styleUrl: './model3d.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Model3dComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef<HTMLDivElement>;

  public loadingProgress: number = 0;
  public isLoading: boolean = true;
  public isError: boolean = false;
  public errorMessage: string = '';

  // Controladores de estado para el expediente holográfico
  public isHistoryOpen: boolean = false;
  public activeTab: string = 'bio';
  private historySub?: Subscription;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private modelGroup!: THREE.Group;

  // Subgrupos de fondo
  private group0 = new THREE.Group();
  private group1 = new THREE.Group();
  private group2 = new THREE.Group();

  // Mini-visores activos en el expediente
  private miniViewers: {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    animationFrameId: number;
    element: HTMLCanvasElement;
  }[] = [];

  private clock = new THREE.Clock();
  private animationFrameId?: number;
  private lenis?: Lenis;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private scrollService: ScrollService
  ) { }

  ngOnInit() {
    this.historySub = this.scrollService.historyState$.subscribe(state => {
      this.isHistoryOpen = state.isOpen;
      if (state.activeTab) {
        this.activeTab = state.activeTab;
      }
      this.cdr.detectChanges();

      if (this.isHistoryOpen) {
        this.initActiveTabMiniViewers();
      } else {
        this.destroyMiniViewers();
      }
    });
  }

  ngAfterViewInit() {
    this.initThree();
    this.loadModel();
  }

  private initThree() {
    const container = this.rendererContainer.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Escena
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xE5E0D8, 0.015);

    // Cámara
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, 28);

    // Renderer 100% transparente (alpha: true)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Grupo de modelo principal
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

    // Añadir subgrupos para la alternancia de fondos
    this.modelGroup.add(this.group0);
    this.modelGroup.add(this.group1);
    this.modelGroup.add(this.group2);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.8);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xC5A059, 2.8);
    dirLight1.position.set(15, 25, 10);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88C0D0, 2.2);
    dirLight2.position.set(-15, -10, -10);
    this.scene.add(dirLight2);

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Inicializar Lenis para scroll fluido y sincronizado
    this.lenis = new Lenis({
      wrapper: window,
      content: document.documentElement,
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
    });

    // Registrar lenis en nuestro ScrollService compartido
    this.scrollService.setLenis(this.lenis);

    this.lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Render loop fuera de zone.js para 60fps constantes
    this.ngZone.runOutsideAngular(() => {
      const animate = (time: number) => {
        if (this.lenis) {
          this.lenis.raf(time);
        }
        ScrollTrigger.update();
        this.renderScene();
        this.animationFrameId = requestAnimationFrame(animate);
      };
      animate(0);
    });
  }

  private loadModel() {
    const loader = new STLLoader();
    const modelsToLoad = [
      { path: 'assets/models/Unnamed Character.stl', group: this.group0 },
      { path: 'assets/models/Unnamed Character (4).stl', group: this.group1 },
      { path: 'assets/models/Unnamed Character (2).stl', group: this.group2 }
    ];

    let loadedCount = 0;
    const progressMap = new Map<string, number>();

    modelsToLoad.forEach((model, index) => {
      loader.load(
        model.path,
        (geometry: any) => {
          geometry.center();
          geometry.computeVertexNormals();
          geometry.computeBoundingBox();

          const box = geometry.boundingBox;
          let size = new THREE.Vector3();
          if (box) {
            box.getSize(size);
          }

          // Material platino/plateado elegante
          const material = new THREE.MeshStandardMaterial({
            color: 0xD8DEE9,
            roughness: 0.25,
            metalness: 0.95,
            flatShading: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.36
          });

          const stlMesh = new THREE.Mesh(geometry, material);
          stlMesh.rotation.x = -Math.PI / 2;

          // Wireframe
          const wireframeGeom = new THREE.WireframeGeometry(geometry);
          const wireframeMat = new THREE.LineBasicMaterial({
            color: 0x88C0D0,
            transparent: true,
            opacity: 0.12
          });
          const wireframeMesh = new THREE.LineSegments(wireframeGeom, wireframeMat);
          wireframeMesh.rotation.x = -Math.PI / 2;

          model.group.add(stlMesh);
          model.group.add(wireframeMesh);

          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 16 / maxDim;
          model.group.scale.set(targetScale, targetScale, targetScale);

          if (box) {
            const heightOffset = (size.y / 2) * targetScale;
            model.group.position.y = -6 + heightOffset;
          }

          // Inicialmente solo el primer modelo es visible
          model.group.visible = (index === 0);

          loadedCount++;
          if (loadedCount === modelsToLoad.length) {
            this.isLoading = false;
            this.isError = false;
            this.cdr.detectChanges();

            // Configurar animaciones de GSAP después de cargar todos los modelos
            this.setupScrollAnimations();
          }
        },
        (xhr: any) => {
          if (xhr.total) {
            progressMap.set(model.path, xhr.loaded / xhr.total);

            // Calcular progreso acumulado promedio
            let sumProgress = 0;
            progressMap.forEach((val) => sumProgress += val);
            this.loadingProgress = Math.round((sumProgress / modelsToLoad.length) * 100);
            this.cdr.detectChanges();
          }
        },
        (error: any) => {
          console.error(`Error cargando modelo STL desde ${model.path}:`, error);
          this.isLoading = false;
          this.isError = true;
          this.errorMessage = 'No se pudo cargar el modelo 3D.';
          this.cdr.detectChanges();
        }
      );
    });
  }

  private setupScrollAnimations() {
    // 1. Fade-in de la opacidad del fondo fixed apuntando a #historia como trigger
    gsap.fromTo('.model3d-fixed-background',
      { opacity: 0 },
      {
        opacity: 0.95,
        scrollTrigger: {
          trigger: '#historia',
          start: 'top 80%',
          end: 'top 20%',
          scrub: true
        }
      }
    );

    // 2. Controlar la rotación Y de la figura 3D directamente usando GSAP y ScrollTrigger con scrub: 1.2
    // Reducido exactamente al 40% de la velocidad anterior (16 giros)
    gsap.to(this.modelGroup.rotation, {
      y: Math.PI * 16.0,
      ease: 'none',
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2
      }
    });

    // 3. Configurar ScrollTriggers independientes para alternancia binaria de visibilidad de modelos
    // De Historia (modelo 0) a Frases (modelo 1)
    ScrollTrigger.create({
      trigger: '#frases',
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: self => {
        if (self.isActive) {
          this.showBackgroundModel(1);
        }
      },
      onLeaveBack: () => {
        this.showBackgroundModel(0);
      }
    });

    // De Frases (modelo 1) a Evolución/Transformación (modelo 2)
    ScrollTrigger.create({
      trigger: '#transformacion',
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: self => {
        if (self.isActive) {
          this.showBackgroundModel(2);
        }
      },
      onLeaveBack: () => {
        this.showBackgroundModel(1);
      }
    });

    // Forzar recalculo de GSAP tras inyección de modelos
    ScrollTrigger.refresh();
  }

  private showBackgroundModel(index: number) {
    this.group0.visible = (index === 0);
    this.group1.visible = (index === 1);
    this.group2.visible = (index === 2);
  }

  public selectTab(tabId: string) {
    this.activeTab = tabId;
    this.cdr.detectChanges();
    this.initActiveTabMiniViewers();
  }

  private initActiveTabMiniViewers() {
    this.destroyMiniViewers();

    // Esperar a que Angular dibuje el DOM de la nueva pestaña
    setTimeout(() => {
      if (this.activeTab === 'bio') {
        this.createMiniViewer(
          'placeholder-avatar',
          'assets/models/Unnamed Character.stl'
        );

      } else if (this.activeTab === 'tribuna') {
        this.createMiniViewer(
          'placeholder-torre',
          'assets/models/Unnamed Character (3).stl'
        );

      } else if (this.activeTab === 'caminantes') {
        this.createMiniViewer(
          'placeholder-leyenda',
          'assets/models/Unnamed Character (4).stl'
        );

        this.createMiniViewer(
          'placeholder-charango',
          'assets/models/Unnamed Character (5).stl'
        );
      }
    }, 50);
  }

  private createMiniViewer(containerId: string, modelPath: string) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none';

    container.appendChild(canvas);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xD8DEE9, 2.5);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88C0D0, 2.0);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new STLLoader();
    loader.load(
      modelPath,
      (geometry: any) => {
        geometry.center();
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        const box = geometry.boundingBox;
        let size = new THREE.Vector3();
        if (box) {
          box.getSize(size);
        }

        const material = new THREE.MeshStandardMaterial({
          color: 0xD8DEE9,
          roughness: 0.2,
          metalness: 0.9,
          flatShading: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.70
        });

        const stlMesh = new THREE.Mesh(geometry, material);
        stlMesh.rotation.x = -Math.PI / 2;

        const wireframeGeom = new THREE.WireframeGeometry(geometry);
        const wireframeMat = new THREE.LineBasicMaterial({
          color: 0x88C0D0,
          transparent: true,
          opacity: 0.15
        });
        const wireframeMesh = new THREE.LineSegments(wireframeGeom, wireframeMat);
        wireframeMesh.rotation.x = -Math.PI / 2;

        group.add(stlMesh);
        group.add(wireframeMesh);

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 12 / maxDim;
        group.scale.set(targetScale, targetScale, targetScale);

        if (box) {
          const heightOffset = (size.y / 2) * targetScale;
          group.position.y = -4 + heightOffset;
        }
      },
      undefined,
      (err: any) => {
        console.error('Error cargando modelo mini:', err);
      }
    );

    let animationFrameId = 0;
    const animateMini = () => {
      if (group) {
        group.rotation.y += 0.008; // rotación lenta e incesante
        group.rotation.x = Math.sin(group.rotation.y * 0.5) * 0.05;
      }
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animateMini);
    };

    this.ngZone.runOutsideAngular(() => {
      animationFrameId = requestAnimationFrame(animateMini);
    });

    this.miniViewers.push({
      renderer,
      scene,
      camera,
      animationFrameId,
      element: canvas
    });
  }

  private destroyMiniViewers() {
    this.miniViewers.forEach(viewer => {
      if (viewer.animationFrameId) {
        cancelAnimationFrame(viewer.animationFrameId);
      }
      if (viewer.renderer) {
        viewer.renderer.dispose();
      }
      if (viewer.element && viewer.element.parentNode) {
        viewer.element.parentNode.removeChild(viewer.element);
      }
    });
    this.miniViewers = [];
  }

  public scrollTo(targetId: string) {
    this.scrollService.scrollTo(targetId);
  }

  public openHistoryModal(tabId: string) {
    this.scrollService.openHistory(tabId);
  }

  public closeHistoryModal() {
    this.scrollService.closeHistory();
  }

  private renderScene() {
    if (this.modelGroup) {
      this.modelGroup.rotation.x = Math.sin(this.modelGroup.rotation.y * 0.2) * 0.08;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private onWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.camera && this.renderer) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  };

  ngOnDestroy() {
    this.destroyMiniViewers();

    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    if (this.historySub) {
      this.historySub.unsubscribe();
    }

    if (this.lenis) {
      this.lenis.destroy();
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
