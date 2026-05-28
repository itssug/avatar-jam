import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-transformacion',
  standalone: true,
  templateUrl: './transformacion.html',
  styleUrl: './transformacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransformacionComponent implements AfterViewInit {

  @ViewChild('transformSection') transformSection!: ElementRef;

  ngAfterViewInit(): void {
    const section = this.transformSection.nativeElement;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: false
      }
    });

    // Phase 1: EL HOMBRE
    tl.fromTo('.phase-1', { opacity: 0 }, { opacity: 1, duration: 1 });
    tl.fromTo('.phase-1 .phase-title--man', { y: 20 }, { y: 0, duration: 1 }, '<');
    tl.to(section, { duration: 1 }); // hold
    tl.to('.phase-1', { opacity: 0, duration: 1 });

    // Phase 2: LA TRANSFORMACION
    tl.fromTo('.phase-2', { opacity: 0 }, { opacity: 1, duration: 1 });
    tl.fromTo('.hud-ring', { scale: 0.5 }, { scale: 1, duration: 1 }, '<');
    tl.fromTo('.hud-ring-inner', { scale: 0.5 }, { scale: 1, duration: 1 }, '<');
    tl.to(section, { duration: 1 }); // hold
    tl.to('.phase-2', { opacity: 0, duration: 1 });

    // Phase 3: EL HEROE
    tl.fromTo('.phase-3', { opacity: 0 }, { opacity: 1, duration: 1 });
    tl.fromTo('.phase-3 .phase-title--hero', { scale: 0.8 }, { scale: 1, duration: 1 }, '<');
    tl.to(section, { duration: 1 }); // hold
    tl.to('.phase-3', { opacity: 0, duration: 1 });

    ScrollTrigger.refresh();
  }
}
