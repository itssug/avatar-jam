import { Injectable } from '@angular/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subject } from 'rxjs';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export interface HistoryState {
  isOpen: boolean;
  activeTab?: string;
}

@Injectable({ providedIn: 'root' })
export class ScrollService {
  public lenisInstance?: Lenis;
  
  // Subject for communication regarding the holographic history modal
  private historyStateSubject = new Subject<HistoryState>();
  public historyState$ = this.historyStateSubject.asObservable();

  setLenis(lenis: Lenis) {
    this.lenisInstance = lenis;
  }

  scrollTo(target: string | number | HTMLElement) {
    if (this.lenisInstance) {
      this.lenisInstance.scrollTo(target, {
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential easing
      });
    } else {
      // Fallback for native scrolling if Lenis is not yet active
      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  openHistory(tabId: string = 'bio') {
    this.historyStateSubject.next({ isOpen: true, activeTab: tabId });
    if (this.lenisInstance) {
      this.lenisInstance.stop(); // Congela el scroll del fondo
    }
  }

  closeHistory() {
    this.historyStateSubject.next({ isOpen: false });
    if (this.lenisInstance) {
      this.lenisInstance.start(); // Libera el scroll del fondo
    }
  }

  init() {
    ScrollTrigger.refresh();
  }

  destroy() {}
}
