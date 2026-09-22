import { Component, input } from '@angular/core';
import { SectionConfig } from '../core/cv.model';

@Component({
  selector: 'app-section-title',
  host: { class: 'section-head' },
  template: `
    <h2 [id]="section().id + '-title'">{{ section().title }}</h2>
    @if (section().intro) { <p class="lead">{{ section().intro }}</p> }
  `,
})
export class SectionTitle {
  readonly section = input.required<SectionConfig>();
}
