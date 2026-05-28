import { Injectable, NgZone } from '@angular/core';
import * as THREE from 'three';

@Injectable({ providedIn: 'root' })
export class ThreeService {
  private renderer!: THREE.WebGLRenderer;
  private animationId!: number;

  init(canvas: HTMLCanvasElement): { scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer } {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x0A0A0A, 1);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { scene, camera, renderer: this.renderer };
  }

  startLoop(ngZone: NgZone, fn: () => void) {
    ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.animationId = requestAnimationFrame(loop);
        fn();
      };
      loop();
    });
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    this.renderer?.dispose();
  }
}
