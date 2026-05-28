import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { ScrollService } from '../../services/scroll.service';

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

  constructor(private scrollService: ScrollService) {}

  openHistory(tabId: string) {
    this.scrollService.openHistory(tabId);
  }

ngAfterViewInit(): void {
  const section = this.storySection.nativeElement;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      pin: false  // el pin lo maneja el height del contenedor
    }
  });

  // Panel 1
  tl.to('.panel-1', { opacity: 1, duration: 0.6 });
  tl.to('.image-1', { opacity: 0.6, y: -80, rotate: -12, duration: 1.5 }, 0);
  tl.to(section, { duration: 1.5 }); // HOLD panel 1
  tl.to('.panel-1', { opacity: 0, y: -100, duration: 0.6 });
  tl.to('.image-1', { opacity: 0, y: -150, duration: 0.6 }, '<');

  // Panel 2
  tl.to('.panel-2', { opacity: 1, duration: 0.6 });
  tl.to('.giant-year', { scale: 1.1, duration: 0.6 }, '<');
  tl.to('.image-2', { opacity: 0.6, y: 100, rotate: 12, duration: 1.5 }, '<');
  tl.to(section, { duration: 1.5 }); // HOLD panel 2
  tl.to('.panel-2', { opacity: 0, scale: 1.1, duration: 0.6 });
  tl.to('.image-2', { opacity: 0, y: 180, duration: 0.6 }, '<');

  // Panel 3
  tl.to('.panel-3', { opacity: 1, duration: 0.6 });
  tl.fromTo('.compadre-title',
    { scale: 0.7, opacity: 0 },
    { scale: 1, opacity: 1, duration: 1.0 }, '<'
  );
  tl.to('.image-3', { opacity: 0.6, y: -120, duration: 1.5 }, '<');
  tl.to('.image-4', { opacity: 0.6, y: 80, rotate: -20, duration: 1.5 }, '<');
  tl.to(section, { duration: 1.5 }); // HOLD panel 3
  tl.to('.panel-3', { opacity: 0, duration: 0.6 });
  tl.to('.image-3', { opacity: 0, y: -180, duration: 0.6 }, '<');
  tl.to('.image-4', { opacity: 0, y: 120, duration: 0.6 }, '<');

  // Panel 4
  tl.to('.giant-year', { opacity: 0.08, scale: 1.3, duration: 0.6 });
  tl.to('.panel-4', { opacity: 1, duration: 0.8 });
  tl.to(section, { duration: 2.0 }); // HOLD panel 4 till the end

  // Parallax bgYear — SIN pin, dentro del mismo contexto
  gsap.to(this.bgYear.nativeElement, {
    y: -180,
    rotate: -8,
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1
      // ← pin: true ELIMINADO
    }
  });

  ScrollTrigger.refresh();
}
}
