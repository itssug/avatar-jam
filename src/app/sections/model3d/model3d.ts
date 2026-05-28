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
  private stlMesh!: THREE.Mesh;
  private wireframeMesh!: THREE.LineSegments;
  private clock = new THREE.Clock();
  private animationFrameId?: number;
  private lenis?: Lenis;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private scrollService: ScrollService
  ) {}

  ngOnInit() {
    this.historySub = this.scrollService.historyState$.subscribe(state => {
      this.isHistoryOpen = state.isOpen;
      if (state.activeTab) {
        this.activeTab = state.activeTab;
      }
      this.cdr.detectChanges();
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

    // Grupo de modelo
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);

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

    loader.load(
      '/Unnamed Character.stl',
      (geometry: any) => {
        geometry.center();
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();

        const box = geometry.boundingBox;
        let size = new THREE.Vector3();
        if (box) {
          box.getSize(size);
        }

        // Material bronce sutil
        const material = new THREE.MeshStandardMaterial({
          color: 0xC5A059,
          roughness: 0.35,
          metalness: 0.8,
          flatShading: true,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.36
        });

        this.stlMesh = new THREE.Mesh(geometry, material);
        this.stlMesh.rotation.x = -Math.PI / 2; // Poner de pie

        // Wireframe
        const wireframeGeom = new THREE.WireframeGeometry(geometry);
        const wireframeMat = new THREE.LineBasicMaterial({
          color: 0x88C0D0,
          transparent: true,
          opacity: 0.12
        });
        this.wireframeMesh = new THREE.LineSegments(wireframeGeom, wireframeMat);
        this.wireframeMesh.rotation.x = -Math.PI / 2;

        this.modelGroup.add(this.stlMesh);
        this.modelGroup.add(this.wireframeMesh);

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 16 / maxDim;
        this.modelGroup.scale.set(targetScale, targetScale, targetScale);
        
        if (box) {
          const heightOffset = (size.y / 2) * targetScale;
          this.modelGroup.position.y = -6 + heightOffset;
        }

        this.isLoading = false;
        this.isError = false;
        this.cdr.detectChanges();

        // --- LÓGICA DE GSAP Y SCROLLTRIGGER ESTRICTAMENTE DENTRO DEL CALLBACK DE ÉXITO ---
        
        // 1. Fade-in de la opacidad del fondo fixed
        gsap.fromTo('.model3d-fixed-background',
          { opacity: 0 },
          {
            opacity: 0.95,
            scrollTrigger: {
              trigger: 'body',
              start: '400vh top', // empieza cuando finaliza "La voz de los sin voz" (Panel 3)
              end: '435vh top',   // totalmente visible 35vh después
              scrub: true
            }
          }
        );

        // 2. Controlar la rotación Y de la figura 3D directamente usando GSAP y ScrollTrigger con scrub: 1.2
        gsap.to(this.modelGroup.rotation, {
          y: Math.PI * 40.0, // 20 vueltas completas distribuidas a lo largo de toda la página
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2
          }
        });

        // Fuerza un Refresh para que GSAP recalcule el alto de la página correctamente tras cargar e insertar el modelo 3D
        ScrollTrigger.refresh();
      },
      (xhr: any) => {
        if (xhr.total) {
          this.loadingProgress = Math.round((xhr.loaded / xhr.total) * 100);
          this.cdr.detectChanges();
        }
      },
      (error: any) => {
        console.error('Error cargando modelo STL:', error);
        this.isLoading = false;
        this.isError = true;
        this.errorMessage = 'No se pudo cargar el modelo 3D.';
        this.cdr.detectChanges();
      }
    );
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
      // Inclinación X sutil basada en la rotación Y animada por GSAP
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
