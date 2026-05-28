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
  selector: 'app-story',
  standalone: true,
  templateUrl: './story.html',
  styleUrl: './story.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoryComponent implements AfterViewInit {

  @ViewChild('storySection') storySection!: ElementRef;
  @ViewChild('bgYear') bgYear!: ElementRef;

  constructor() {}

  ngAfterViewInit(): void {
    const section = this.storySection.nativeElement;

    // Animación de los contenedores intercalados .scroll-fade-box
    gsap.utils.toArray('.scroll-fade-box').forEach((box: any) => {
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

    // Parallax bgYear — SIN pin, dentro del mismo contexto
    gsap.to(this.bgYear.nativeElement, {
      y: -180,
      rotate: -8,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    ScrollTrigger.refresh();
  }
}
