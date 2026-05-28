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

  const texts =
    this.storySection.nativeElement.querySelectorAll(
      '.story-text, .story-name'
    );

  const compadre =
    this.storySection.nativeElement.querySelector('.compadre-title');

  const divider =
    this.storySection.nativeElement.querySelector('.story-divider');

  const futureYear =
    this.storySection.nativeElement.querySelector('.future-year');

  // PARALLAX DEL AÑO GIGANTE
  gsap.to(this.bgYear.nativeElement, {
    scrollTrigger: {
      trigger: this.storySection.nativeElement,
      start: "top bottom",
      end: "bottom top",
      scrub: true
    },
    y: -200,
    rotate: -8,
    opacity: 0.4
  });

  // REVEAL DE TEXTOS
  texts.forEach((text: HTMLElement, index: number) => {

    gsap.to(text, {
      scrollTrigger: {
        trigger: text,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },

      opacity: 1,
      y: 0,

      duration: 1.4,
      ease: "power3.out",

      delay: index * 0.15
    });

  });

  // DIVIDER
  gsap.to(divider, {
    scrollTrigger: {
      trigger: divider,
      start: "top 85%",
      toggleActions: "play none none reverse",
    },

    opacity: 1,
    height: 120,

    duration: 1.5,
    ease: "power2.out"
  });

  // EL COMPADRE
  gsap.to(compadre, {
    scrollTrigger: {
      trigger: compadre,
      start: "top 75%",
      toggleActions: "play none none reverse",
    },

    opacity: 1,
    scale: 1,

    duration: 2,
    ease: "expo.out"
  });

  // 2095
  gsap.to(futureYear, {
    scrollTrigger: {
      trigger: futureYear,
      start: "top 80%",
      toggleActions: "play none none reverse",
    },

    opacity: 1,
    scale: 1,

    duration: 1.8,
    ease: "power4.out"
  });

}
}
