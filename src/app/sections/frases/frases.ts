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
  audioLabel: string;
  audioPath: string;
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
  public audioProgress: number = 0;
  public audioDuration: number = 0;
  public audioCurrentTime: number = 0;
  private currentAudio?: HTMLAudioElement;
  private progressInterval?: ReturnType<typeof setInterval>;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.stopProgressTracking();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = undefined;
    }
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      if (this.currentAudio) {
        this.audioCurrentTime = this.currentAudio.currentTime;
        this.audioDuration = this.currentAudio.duration || 0;
        this.audioProgress = this.audioDuration
          ? (this.audioCurrentTime / this.audioDuration) * 100
          : 0;
        this.cdr.detectChanges();
      }
    }, 200);
  }

  public toggleAudio(frase: Frase): void {
    if (this.activeAudioId === frase.id) {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.stopProgressTracking();
        this.activeAudioId = null;
        this.audioProgress = 0;
        this.audioCurrentTime = 0;
      }
    } else {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.stopProgressTracking();
      }

      this.currentAudio = new Audio(frase.audioPath);
      this.activeAudioId = frase.id;
      this.audioProgress = 0;
      this.audioCurrentTime = 0;

      this.currentAudio.addEventListener('ended', () => {
        this.stopProgressTracking();
        this.activeAudioId = null;
        this.audioProgress = 0;
        this.audioCurrentTime = 0;
        this.cdr.detectChanges();
      });

      this.currentAudio.addEventListener('play', () => {
        this.activeAudioId = frase.id;
        this.startProgressTracking();
        this.cdr.detectChanges();
      });

      this.currentAudio.play().catch(err => {
        console.error('Error al reproducir audio:', err);
        this.activeAudioId = null;
        this.stopProgressTracking();
        this.cdr.detectChanges();
      });
    }
    this.cdr.detectChanges();
  }

  public formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  frases: Frase[] = [
    {
      id: 1,
      quote: 'ALGUNA VEZ HAN AMADO',
      subtitle: 'En esta entrevista, Palanque habla desde el corazón sobre el amor de su vida.',
      tag: 'PROTOCOLO // S-03 // CAJA 01',
      audioLabel: 'ENTREVISTA — PALANQUE',
      audioPath: 'assets/audios/amado.mp3'
    },
    {
      id: 2,
      quote: 'LA VIOLENCIA EN BOLIVIA',
      subtitle: 'Palanque denuncia sin filtros la espiral de violencia que azotaba el país. Su voz se convirtió en escudo para quienes no tenían con qué defenderse.',
      tag: 'PROTOCOLO // S-03 // CAJA 02',
      audioLabel: 'DENUNCIA — VIOLENCIA',
      audioPath: 'assets/audios/situaciones_violencia.mp3'
    },
    {
      id: 3,
      quote: 'PALANQUE EN LA RTP',
      subtitle: 'Desde los micrófonos de la Red de Talleres del Pueblo, su señal cruzó valles y montañas. Un protocolo de comunicación que ningún poder pudo interrumpir.',
      tag: 'PROTOCOLO // S-03 // CAJA 03',
      audioLabel: 'TRANSMISIÓN — RTP',
      audioPath: 'assets/audios/RTP_juan.mp3'
    },
    {
      id: 4,
      quote: 'CARTA A COMADRE',
      subtitle: 'Una carta íntima y profunda. Palanque le habla a su pueblo con la ternura de quien conoce cada calle, cada historia y cada dolor del reino de Kollasuyo.',
      tag: 'PROTOCOLO // S-03 // CAJA 04',
      audioLabel: 'MENSAJE — CARTA PERSONAL',
      audioPath: 'assets/audios/carta_comadre.mp3'
    }
  ];

  ngAfterViewInit(): void {
    gsap.utils.toArray('.frases-section .scroll-fade-box').forEach((box: any) => {
      gsap.timeline({
        scrollTrigger: {
          trigger: box,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      })
        .fromTo(box, { opacity: 0.2, y: 50 }, { opacity: 1, y: 0, ease: 'none', duration: 1 })
        .to(box, { opacity: 0, y: -50, ease: 'none', duration: 1 });
    });

    ScrollTrigger.refresh();
  }
}