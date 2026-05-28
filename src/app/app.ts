import { Component, OnInit } from '@angular/core';
import { HeroComponent } from './sections/hero/hero';
import { StoryComponent } from './sections/story/story';
import { Model3dComponent } from './sections/model3d/model3d';
import { FrasesComponent } from './sections/frases/frases';
import { TransformacionComponent } from './sections/transformacion/transformacion';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeroComponent,
    StoryComponent,
    Model3dComponent,
    FrasesComponent,
    TransformacionComponent
  ],
  templateUrl: './app.html',
})
export class App implements OnInit {
  ngOnInit() {}
}
