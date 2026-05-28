import {
  Component,
  AfterViewInit,
  OnDestroy,
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
export class StoryComponent implements AfterViewInit, OnDestroy {

  @ViewChild('storySection') storySection!: ElementRef;
  @ViewChild('bgYear') bgYear!: ElementRef;

  private scrollTriggers: ScrollTrigger[] = [];

  ngAfterViewInit(): void {
    // Wait for Angular's CD + layout to settle before GSAP reads DOM metrics
    setTimeout(() => this.initScrollAnimations(), 100);
  }

  private initScrollAnimations(): void {
    const section = this.storySection.nativeElement;
    const panels = gsap.utils.toArray<HTMLElement>('.panel', section);
    const totalPanels = panels.length;

    // ─── PANEL PINNED TIMELINE ───────────────────────────────────────────────
    // pin: true locks the section in the viewport while GSAP scrubs through
    // all panels. end is calculated so each panel gets ~100vh of scroll space.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${window.innerHeight * (totalPanels + 0.5)}`,
        scrub: 1.2,
        pin: true,           // ← KEY FIX: pin keeps section in viewport
        anticipatePin: 1,
        onUpdate: (self) => {
          // Keep bgYear parallax in sync with the pinned timeline
          gsap.set(this.bgYear.nativeElement, {
            y: self.progress * -200,
            rotate: self.progress * -10,
          });
        }
      }
    });

    // ─── PANEL 1 ─────────────────────────────────────────────────────────────
    tl
      .set('.panel-1', { opacity: 0, y: 40 })
      .to('.panel-1', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
      .to('.image-1', { y: -80, rotate: -12, scale: 1.05, duration: 2 }, '<0.2')
      .to('.panel-1', { opacity: 0, y: -60, duration: 0.8, ease: 'power2.in' }, '+=0.5')

    // ─── PANEL 2 ─────────────────────────────────────────────────────────────
      .set('.panel-2', { opacity: 0, scale: 0.95 })
      .to('.panel-2', { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' })
      .to('.giant-year', { scale: 1.1, opacity: 0.2, duration: 1.5 }, '<')
      .to('.image-2', { y: 100, rotate: 12, duration: 2 }, '<')
      .to('.panel-2', { opacity: 0, scale: 1.05, duration: 0.8, ease: 'power2.in' }, '+=0.5')

    // ─── PANEL 3 ─────────────────────────────────────────────────────────────
      .set('.panel-3', { opacity: 0 })
      .to('.panel-3', { opacity: 1, duration: 0.6 })
      .fromTo('.compadre-title',
        { scale: 0.65, opacity: 0, filter: 'blur(12px)' },
        { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.8, ease: 'expo.out' },
        '<'
      )
      .to('.image-3', { y: -120, scale: 1.1, duration: 2 }, '<')
      .to('.image-4', { y: 80, rotate: -20, duration: 2 }, '<')
      .to('.panel-3', { opacity: 0, duration: 0.8 }, '+=0.5')

    // ─── PANEL 4 ─────────────────────────────────────────────────────────────
      .set('.panel-4', { opacity: 0, x: 60 })
      .to('.giant-year', { opacity: 0.04, scale: 1.4, duration: 1 })
      .to('.panel-4', { opacity: 1, x: 0, duration: 1.5, ease: 'power3.out' }, '<0.3');

    // Store for cleanup
    this.scrollTriggers = ScrollTrigger.getAll();

    ScrollTrigger.refresh();
  }

  ngOnDestroy(): void {
    // Clean up to avoid memory leaks on route changes
    this.scrollTriggers.forEach(st => st.kill());
    ScrollTrigger.refresh();
  }
}
