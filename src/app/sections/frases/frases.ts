import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
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
  audioPath?: string;
}

@Component({
  selector: 'app-frases',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frases.html',
  styleUrl: './frases.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FrasesComponent implements AfterViewInit, OnInit, OnDestroy {

  @ViewChild('frasesSection') frasesSection!: ElementRef;

  public activeAudioId: number | null = null;
  private currentAudio?: HTMLAudioElement;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Inicialización vacía para carga bajo demanda dinámica
  }

  ngOnDestroy(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = undefined;
    }
  }

  public toggleAudio(frase: Frase) {
    if (!frase.audioPath) return;

    if (this.activeAudioId === frase.id) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.activeAudioId = null;
      }
    } else {
      if (this.currentAudio) {
        this.currentAudio.pause();
      }

      this.currentAudio = new Audio(frase.audioPath);
      this.activeAudioId = frase.id;

      this.currentAudio.addEventListener('ended', () => {
        this.activeAudioId = null;
        this.cdr.detectChanges();
      });

      this.currentAudio.addEventListener('pause', () => {
        if (this.activeAudioId === frase.id) {
          this.activeAudioId = null;
          this.cdr.detectChanges();
        }
      });

      this.currentAudio.addEventListener('play', () => {
        this.activeAudioId = frase.id;
        this.cdr.detectChanges();
      });

      this.currentAudio.play().catch(err => {
        console.error('Error al reproducir audio:', err);
        this.activeAudioId = null;
        this.cdr.detectChanges();
      });
    }
    this.cdr.detectChanges();
  }

  frases: Frase[] = [
    {
      id: 1,
      quote: '¡JALLALLA!',
      subtitle: '«¿Cómo creen que me siento? ¿Alguna vez ustedes han amado? Yo no tengo ningún comentario que hacerles. No me hablen de ella, por favor, porque hieren mis sentimientos más profundos».',
      tag: 'TRANSMISIÓN INTERCEPTADA · 2095',
      audioPath: '/videoplayback.m4a'
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
    },
    {
      id: 6,
      quote: 'COMPADRES DEL ALMA',
      subtitle: '«La política pasa, los amigos quedan. La lealtad al pueblo es un juramento eterno».',
      tag: 'SEÑAL EN VIVO · 732 KHZ',
      audioPath: '/videoplayback.m4a'
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

    // Loop dinámico y adaptativo para animar todas las frases sin hardcoding
    this.frases.forEach((frase, i) => {
      const panelClass = `.frase-panel-${frase.id}`;

      tl.fromTo(panelClass,
        { opacity: 0 },
        { opacity: 1, duration: 1 }
      );
      tl.fromTo(`${panelClass} .frase-quote`,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 }, '<'
      );
      tl.fromTo(`${panelClass} .frase-number`,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1 }, '<'
      );
      tl.fromTo(`${panelClass} .frase-tag`,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8 }, '<0.2'
      );
      tl.fromTo(`${panelClass} .frase-line-h`,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, transformOrigin: 'left center' }, '<'
      );
      tl.to(section, { duration: 0.6 }); // hold

      // Desvanecer todas las frases salvo que sea la última
      tl.to(panelClass, { opacity: 0, duration: 0.8 });
    });

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
