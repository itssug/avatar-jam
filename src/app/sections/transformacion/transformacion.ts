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
    const transmutationContainer = section.querySelector('.transmutation-scroll-container');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: transmutationContainer,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: false
      }
    });

    // --- PARTE 1: JUAN CARLOS PALENQUE + BIOGRAFÍA SECUENCIAL ---
    // Entrada inicial de la Fase 1
    tl.fromTo('.phase-1', { opacity: 0 }, { opacity: 1, duration: 1.5 });
    tl.fromTo('.phase-1 .phase-title--man', { y: -30 }, { y: 0, duration: 1.5 }, '<');
    tl.fromTo('.phase-1 .btn-transmute', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.5 }, '<0.2');

    // RECUADRO 1 (Primero)
    // Cae desde arriba (-150px) hasta el centro (0px)
    tl.fromTo('.phase-1 .box-1', { y: -150, opacity: 0, pointerEvents: 'none' }, { y: 0, opacity: 1, pointerEvents: 'auto', duration: 2, ease: 'power2.out' }, '<0.3');
    tl.to(section, { duration: 3.5 }); // hold Box 1
    // Box 1 continúa bajando hacia la salida (+100px) y se desvanece
    tl.to('.phase-1 .box-1', { y: 100, opacity: 0, pointerEvents: 'none', duration: 1.5 });

    // RECUADRO 2 (Segundo)
    // Cae desde arriba (-150px) hasta el centro (0px)
    tl.fromTo('.phase-1 .box-2', { y: -150, opacity: 0, pointerEvents: 'none' }, { y: 0, opacity: 1, pointerEvents: 'auto', duration: 2, ease: 'power2.out' }, '<0.2');
    tl.to(section, { duration: 3.5 }); // hold Box 2
    // Box 2 continúa bajando hacia la salida (+100px) y se desvanece
    tl.to('.phase-1 .box-2', { y: 100, opacity: 0, pointerEvents: 'none', duration: 1.5 });

    // RECUADRO 3 (Tercero)
    // Cae desde arriba (-150px) hasta el centro (0px)
    tl.fromTo('.phase-1 .box-3', { y: -150, opacity: 0, pointerEvents: 'none' }, { y: 0, opacity: 1, pointerEvents: 'auto', duration: 2, ease: 'power2.out' }, '<0.2');
    tl.to(section, { duration: 3.5 }); // hold Box 3
    
    // --- PARTE 2: LA GRAN TRANSMUTACIÓN CYBERPUNK ---
    // Todo lo de la Fase 1 desaparece (incluyendo el título y Box 3)
    tl.to('.phase-1', { opacity: 0, duration: 1.5 });

    // Fase 2 entra (HUD rings y glitch de transmutación)
    tl.fromTo('.phase-2', { opacity: 0 }, { opacity: 1, duration: 1.5 }, '<0.2');
    tl.fromTo('.hud-ring', { scale: 0.5 }, { scale: 1, duration: 1.5 }, '<');
    tl.fromTo('.hud-ring-inner', { scale: 0.5 }, { scale: 1, duration: 1.5 }, '<');
    tl.to(section, { duration: 3.5 }); // hold transmutación
    tl.to('.phase-2', { opacity: 0, duration: 1.5 });

    // --- PARTE 3: EL HÉROE REVELADO (EL COMPADRE 3000) ---
    // Fase 3 entra (El Compadre 3000)
    tl.fromTo('.phase-3', { opacity: 0 }, { opacity: 1, duration: 1.5 });
    tl.fromTo('.phase-3 .phase-title--hero', { scale: 0.8 }, { scale: 1, duration: 1.5 }, '<');
    tl.to(section, { duration: 5 }); // queda fijo y espectacular al final

    // --- PARTE 4: CONTENEDORES SCROLL-FADE-BOX EN EVOLUCIÓN ---
    gsap.utils.toArray('.transform-wrapper .scroll-fade-box').forEach((box: any) => {
      gsap.timeline({
        scrollTrigger: {
          trigger: box,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
      .fromTo(box, {
        opacity: 0.2,
        y: 50
      }, {
        opacity: 1,
        y: 0,
        ease: 'none',
        duration: 1
      })
      .to(box, {
        opacity: 0,
        y: -50,
        ease: 'none',
        duration: 1
      });
    });

    ScrollTrigger.refresh();
  }
}
