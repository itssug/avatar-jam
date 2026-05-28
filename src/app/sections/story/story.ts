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

  ngAfterViewInit(): void {

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: this.storySection.nativeElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    /* =========================
       PANEL 1
    ========================= */

    tl.to('.panel-1', {
      opacity: 1,
      duration: 1
    });

    tl.to('.image-1', {
      y: -80,
      rotate: -12,
      duration: 2
    }, 0);

    tl.to('.panel-1', {
      opacity: 0,
      y: -100,
      duration: 1
    });

    /* =========================
       PANEL 2
    ========================= */

    tl.to('.panel-2', {
      opacity: 1,
      duration: 1
    });

    tl.to('.giant-year', {
      scale: 1.1,
      duration: 1
    }, "<");

    tl.to('.image-2', {
      y: 100,
      rotate: 12,
      duration: 2
    }, "<");

    tl.to('.panel-2', {
      opacity: 0,
      scale: 1.1,
      duration: 1
    });

    /* =========================
       PANEL 3
    ========================= */

    tl.to('.panel-3', {
      opacity: 1,
      duration: 1
    });

    tl.fromTo('.compadre-title',
      {
        scale: 0.7,
        opacity: 0
      },
      {
        scale: 1,
        opacity: 1,
        duration: 1.5
      },
      "<"
    );

    tl.to('.image-3', {
      y: -120,
      duration: 2
    }, "<");

    tl.to('.image-4', {
      y: 80,
      rotate: -20,
      duration: 2
    }, "<");

    tl.to('.panel-3', {
      opacity: 0,
      duration: 1
    });

    /* =========================
       FUTURE
    ========================= */

    tl.to('.giant-year', {
      opacity: 0.08,
      scale: 1.3,
      duration: 1
    });

    tl.to('.panel-4', {
      opacity: 1,
      duration: 1.5
    });

    /* =========================
       GLOBAL PARALLAX
    ========================= */

    gsap.to(this.bgYear.nativeElement, {

      y: -180,
      rotate: -8,
      scrollTrigger: {
        trigger: this.storySection.nativeElement,
        start: 'top top',
        end: '+=4000',
        scrub: 1,
        pin: true,
        anticipatePin: 1
      }

    });
    ScrollTrigger.refresh();
  }
}
