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
  @ViewChild('line1', { static: true }) line1Ref!: ElementRef;
  @ViewChild('line2', { static: true }) line2Ref!: ElementRef;
  @ViewChild('line3', { static: true }) line3Ref!: ElementRef;
  @ViewChild('year',  { static: true }) yearRef!:  ElementRef;

  ngAfterViewInit() {
    const lines = [
      this.line1Ref.nativeElement,
      this.line2Ref.nativeElement,
      this.line3Ref.nativeElement,
    ];

    lines.forEach((line) => {
      gsap.set(line, { opacity: 0, y: 50 });

      ScrollTrigger.create({
        trigger: line,
        start: 'top 90%',
        onEnter: () => {
          gsap.to(line, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
        },
        onLeaveBack: () => {
          gsap.to(line, { opacity: 0, y: 50, duration: 0.5 });
        }
      });
    });

    gsap.set(this.yearRef.nativeElement, { opacity: 0 });

    ScrollTrigger.create({
      trigger: this.yearRef.nativeElement,
      start: 'top 90%',
      onEnter: () => {
        gsap.to(this.yearRef.nativeElement, {
          opacity: 1, duration: 1.5, ease: 'power4.out'
        });
      },
      onLeaveBack: () => {
        gsap.to(this.yearRef.nativeElement, { opacity: 0, duration: 0.5 });
      }
    });
  }
}
