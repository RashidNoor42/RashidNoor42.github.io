import { Component, computed, inject, input } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { CvData, SectionConfig } from '../core/cv.model';
import { ageFrom, formatDate } from '../core/format';
import { SectionTitle } from './section-title';

@Component({
  selector: 'app-about',
  imports: [SectionTitle],
  template: `
    <section id="about" class="section" aria-labelledby="about-title">
      <div class="wrap">
        <app-section-title [section]="section()" />
        <div class="about-grid" [class.no-photo]="!p().photo">
          @if (p().photo) {
            <div class="portrait">
              <img [src]="store.img(p().photo)" [alt]="'Portrait of ' + p().name" width="800" height="1388" loading="lazy" />
            </div>
          }
          <div class="about-body">
            @if (p().headline) { <h3 class="about-headline">{{ p().headline }}</h3> }
            @if (p().shortIntro) { <p>{{ p().shortIntro }}</p> }
            @if (p().bio) { <p>{{ p().bio }}</p> }
            @if (facts().length) {
              <dl class="facts">
                @for (f of facts(); track f.label) {
                  <div>
                    <dt>{{ f.label }}</dt>
                    <dd>
                      @if (f.href) { <a [href]="f.href">{{ f.value }}</a> } @else { {{ f.value }} }
                    </dd>
                  </div>
                }
              </dl>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class About {
  readonly cv = input.required<CvData>();
  readonly section = input.required<SectionConfig>();
  readonly store = inject(CvStore);
  readonly p = computed(() => this.cv().profile);

  /** Empty fields are hidden, so clearing one in the dashboard removes it from the page. */
  readonly facts = computed(() => {
    const p = this.p();
    const age = p.showAge && p.birthday ? ageFrom(p.birthday) : null;
    const facts: { label: string; value: string; href?: string }[] = [
      { label: 'Degree', value: p.degree },
      { label: 'Based in', value: p.city },
      { label: 'Email', value: p.email, href: p.email ? 'mailto:' + p.email : undefined },
      { label: 'Phone', value: p.phone, href: p.phone ? 'tel:' + p.phone.replace(/[^+\d]/g, '') : undefined },
      { label: 'Website', value: p.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), href: p.website || undefined },
      { label: 'Birthday', value: formatDate(p.birthday) },
      { label: 'Age', value: age != null ? String(age) : '' },
      { label: p.availabilityLabel || 'Availability', value: p.availability },
    ];
    return facts.filter((f) => f.value);
  });
}
