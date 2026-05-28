import { Component, OnInit } from '@angular/core';
import { HeroComponent } from './sections/hero/hero';
import { StoryComponent } from './sections/story/story';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeroComponent, StoryComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  ngOnInit() {}
}
