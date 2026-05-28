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
      quote: 'MÓDULO TRIBUNA LIBRE',
      subtitle: 'El protocolo principal del sistema. Permitía que cualquier ciudadano rompiera los bloqueos de información y denunciara las injusticias en transmisión abierta para todo el valle.',
      tag: 'PROTOCOLO // S-03 // CAJA 01',
      audioPath: '/videoplayback.m4a'
    },
    {
      id: 2,
      quote: 'FRECUENCIA CAMINANTE',
      subtitle: 'Un algoritmo de restauración moral. Sus palabras operaban como un parche del sistema para quienes sufrían el desgaste en los mercados y en las minas.',
      tag: 'PROTOCOLO // S-03 // CAJA 02'
    },
    {
      id: 3,
      quote: 'ENSAMBLAJE DE GREMIOS',
      subtitle: 'Expansión de la red "RTP". No solo conectaba voces, sino que forjó alianzas entre trabajadores y artesanos, creando un frente unificado contra las corporaciones corruptas.',
      tag: 'PROTOCOLO // S-03 // CAJA 03'
    },
    {
      id: 4,
      quote: 'ESCUDO INCORRUPTIBLE',
      subtitle: 'Resistencia pasiva pero inquebrantable. A pesar de los ataques de las corporaciones corporativas del estaño y los bloqueos de señal, su núcleo nunca fue hackeado ni comprado.',
      tag: 'PROTOCOLO // S-03 // CAJA 04'
    }
  ];

  ngAfterViewInit(): void {
    // Animación de los contenedores intercalados .scroll-fade-box
    gsap.utils.toArray('.frases-section .scroll-fade-box').forEach((box: any) => {
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
