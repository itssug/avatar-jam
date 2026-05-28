import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Frase {
  id: number;
  quote: string;
  subtitle: string;
  tag: string;
}

@Component({
  selector: 'app-frases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frases.html',
  styleUrl: './frases.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrasesComponent implements AfterViewInit {

  @ViewChild('frasesSection') frasesSection!: ElementRef;

  frases: Frase[] = [
    {
      id: 1,
      quote: '¡JALLALLA!',
      subtitle: 'El grito de guerra del pueblo',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095'
    },
    {
      id: 2,
      quote: 'LA VOZ DE LOS SIN VOZ',
      subtitle: 'Su misión, su legado',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095'
    },
    {
      id: 3,
      quote: 'EL PUEBLO UNIDO JAMÁS SERÁ VENCIDO',
      subtitle: 'El clamor de las calles',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095'
    },
    {
      id: 4,
      quote: 'AQUÍ ESTAMOS, NO NOS VAMOS',
      subtitle: 'La resistencia del compadre',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095'
    },
    {
      id: 5,
      quote: 'ESTA TRANSMISIÓN ES PARA TI, COMPAÑERO',
      subtitle: 'Cada palabra, un acto de justicia',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095'
    }
  ];

  ngAfterViewInit(): void {
    const section = this.frasesSection.nativeElement;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: false
      }
    });

    // Panel 1 — fade in, hold, fade out
    tl.fromTo('.frase-panel-1',
      { opacity: 0 },
      { opacity: 1, duration: 1 }
    );
    tl.fromTo('.frase-panel-1 .frase-quote',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-1 .frase-number',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-1 .frase-tag',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
    );
    tl.fromTo('.frase-panel-1 .frase-line-h',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
    );
    tl.to(section, { duration: 0.6 }); // hold
    tl.to('.frase-panel-1', { opacity: 0, duration: 0.8 });

    // Panel 2
    tl.fromTo('.frase-panel-2',
      { opacity: 0 },
      { opacity: 1, duration: 1 }
    );
    tl.fromTo('.frase-panel-2 .frase-quote',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-2 .frase-number',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-2 .frase-tag',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
    );
    tl.fromTo('.frase-panel-2 .frase-line-h',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
    );
    tl.to(section, { duration: 0.6 });
    tl.to('.frase-panel-2', { opacity: 0, duration: 0.8 });

    // Panel 3
    tl.fromTo('.frase-panel-3',
      { opacity: 0 },
      { opacity: 1, duration: 1 }
    );
    tl.fromTo('.frase-panel-3 .frase-quote',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-3 .frase-number',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-3 .frase-tag',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
    );
    tl.fromTo('.frase-panel-3 .frase-line-h',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
    );
    tl.to(section, { duration: 0.6 });
    tl.to('.frase-panel-3', { opacity: 0, duration: 0.8 });

    // Panel 4
    tl.fromTo('.frase-panel-4',
      { opacity: 0 },
      { opacity: 1, duration: 1 }
    );
    tl.fromTo('.frase-panel-4 .frase-quote',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-4 .frase-number',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-4 .frase-tag',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
    );
    tl.fromTo('.frase-panel-4 .frase-line-h',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
    );
    tl.to(section, { duration: 0.6 });
    tl.to('.frase-panel-4', { opacity: 0, duration: 0.8 });

    // Panel 5 — last panel, fade in and hold (no fade out)
    tl.fromTo('.frase-panel-5',
      { opacity: 0 },
      { opacity: 1, duration: 1 }
    );
    tl.fromTo('.frase-panel-5 .frase-quote',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-5 .frase-number',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1 }, '<'
    );
    tl.fromTo('.frase-panel-5 .frase-tag',
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
    );
    tl.fromTo('.frase-panel-5 .frase-line-h',
      { scaleX: 0 },
      { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
    );
    tl.to(section, { duration: 0.6 });
    tl.to('.frase-panel-5', { opacity: 0, duration: 0.8 });

    // Pulsing cyan line animation (continuous)
    gsap.to('.frase-pulse-line', {
      opacity: 0.3,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    ScrollTrigger.refresh();
  }
}
