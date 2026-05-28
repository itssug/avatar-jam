import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-story',
  standalone: true,
  templateUrl: './story.html',
  styleUrl: './story.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoryComponent implements AfterViewInit {
  @ViewChild('storySection') storySection!: ElementRef;
  @ViewChild('bgYear') bgYear!: ElementRef;

  ngAfterViewInit() {
    const texts = this.storySection.nativeElement.querySelectorAll('.story-text');

    // 1. Animación del año gigante (Efecto parallax sobre el fondo 3D)
    gsap.to(this.bgYear.nativeElement, {
      scrollTrigger: {
        trigger: this.storySection.nativeElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      },
      y: -120,
      opacity: 0.5
    });

    // 2. Revelado rápido y fluido de los textos
    texts.forEach((text: HTMLElement, index: number) => {
      gsap.to(text, {
        scrollTrigger: {
          trigger: text,
          // Al poner "top 85%", la animación inicia apenas el texto asome un 15% en pantalla
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        delay: index * 0.1
      });
    });
  }
}
