import { Component, input } from '@angular/core';
import { CvData, SectionConfig } from '../core/cv.model';
import { formatMonth } from '../core/format';
import { SectionTitle } from './section-title';

/** Experience and education as one timeline each. */
@Component({
  selector: 'app-resume',
  imports: [SectionTitle],
  template: `
    <section id="resume" class="section" aria-labelledby="resume-title">
      <div class="wrap">
        <app-section-title [section]="section()" />
        @if (cv().experience.length) {
          <ol class="timeline">
            @for (x of cv().experience; track x.id) {
              <li [class.current]="!x.end">
                <p class="when">
                  <time [attr.datetime]="x.start">{{ month(x.start) }}</time>
                  <span class="when-sep" aria-hidden="true"></span>
                  @if (x.end) { <time [attr.datetime]="x.end">{{ month(x.end) }}</time> } @else { <span class="now">Now</span> }
                </p>
                <div class="what">
                  <h3>{{ x.title }}</h3>
                  <p class="where">{{ x.company }}</p>
                  @if (x.points.length) {
                    <ul>
                      @for (pt of x.points; track $index) { <li>{{ pt }}</li> }
                    </ul>
                  }
                </div>
              </li>
            }
          </ol>
        }
        @if (cv().education.length) {
          <h3 class="subhead">Education</h3>
          <ol class="timeline timeline-compact">
            @for (e of cv().education; track e.id) {
              <li [class.current]="!e.end">
                <p class="when">
                  <time [attr.datetime]="e.start">{{ month(e.start) }}</time>
                  <span class="when-sep" aria-hidden="true"></span>
                  @if (e.end) { <time [attr.datetime]="e.end">{{ month(e.end) }}</time> } @else { <span class="now">Now</span> }
                </p>
                <div class="what">
                  <h3>{{ e.degree }}</h3>
                  <p class="where">{{ e.institution }}</p>
                  @if (e.description) { <p>{{ e.description }}</p> }
                </div>
              </li>
            }
          </ol>
        }
      </div>
    </section>
  `,
})
export class Resume {
  readonly cv = input.required<CvData>();
  readonly section = input.required<SectionConfig>();
  readonly month = formatMonth;
}
