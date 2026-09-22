import { Component, input } from '@angular/core';
import { CvData, SectionConfig } from '../core/cv.model';
import { SectionTitle } from './section-title';

@Component({
  selector: 'app-skills',
  imports: [SectionTitle],
  template: `
    <section id="skills" class="section section-tint" aria-labelledby="skills-title">
      <div class="wrap">
        <app-section-title [section]="section()" />
        <ul class="skill-list">
          @for (s of cv().skills; track s.id) {
            <li>
              <span class="skill-name">{{ s.name }}</span>
              <span class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="s.level" [attr.aria-label]="s.name">
                @for (t of ticks; track t) { <span [class.on]="t < s.level / 5"></span> }
              </span>
              <span class="skill-level">{{ s.level }}%</span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class Skills {
  readonly cv = input.required<CvData>();
  readonly section = input.required<SectionConfig>();
  /** 20 segments, 5% each. */
  readonly ticks = Array.from({ length: 20 }, (_, i) => i);
}
