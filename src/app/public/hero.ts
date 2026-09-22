import { Component, computed, input } from '@angular/core';
import { CvData } from '../core/cv.model';
import { SkillGraph } from './skill-graph';
import { TypedText } from './typed-text';

@Component({
  selector: 'app-hero',
  imports: [TypedText, SkillGraph],
  template: `
    <section id="hero" class="hero" aria-labelledby="hero-name">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          @if (p().availability) {
            <p class="status"><span class="status-dot" aria-hidden="true"></span>{{ p().availabilityLabel || 'Status' }}: {{ p().availability }}</p>
          }
          <h1 id="hero-name" class="hero-name">
            @for (part of nameParts(); track $index) { <span>{{ part }}</span> }
          </h1>
          @if (p().typedItems.length) {
            <p class="repl" aria-live="off">
              <span class="repl-prompt" aria-hidden="true">&gt;&gt;&gt;</span> {{ handle() }}.role<br />
              <span class="repl-out">'<app-typed-text [words]="p().typedItems" />'</span>
            </p>
          }
          @if (p().summary) { <p class="hero-summary">{{ p().summary }}</p> }
          <div class="hero-actions">
            @if (hasContact()) { <a class="button button-primary" href="#contact" (click)="jump($event, 'contact')">Get in touch</a> }
            @if (hasWork()) { <a class="button" href="#portfolio" (click)="jump($event, 'portfolio')">See my work</a> }
          </div>
          <ul class="hero-meta">
            @if (p().city) { <li><i class="bx bx-map" aria-hidden="true"></i>{{ p().city }}</li> }
            @for (l of heroLinks(); track l.id) {
              <li><a [href]="l.url" target="_blank" rel="noopener"><i [class]="l.icon" aria-hidden="true"></i>{{ l.label }}</a></li>
            }
          </ul>
        </div>
        @if (cv().skills.length > 1) {
          <figure class="hero-visual">
            <app-skill-graph [skills]="cv().skills" />
            <figcaption>My stack as a service graph. Bigger node, more experience.</figcaption>
          </figure>
        }
      </div>
    </section>
  `,
})
export class Hero {
  readonly cv = input.required<CvData>();
  readonly p = computed(() => this.cv().profile);
  readonly nameParts = computed(() => this.p().name.trim().split(/\s+/));
  readonly handle = computed(() => (this.nameParts()[0] || 'me').toLowerCase().replace(/[^a-z0-9_]/g, '') || 'me');
  readonly heroLinks = computed(() => this.cv().social.filter((s) => s.showInHero && s.url));
  readonly hasContact = computed(() => this.cv().sections.some((s) => s.id === 'contact' && s.visible));
  readonly hasWork = computed(() => this.cv().projects.length > 0 && this.cv().sections.some((s) => s.id === 'portfolio' && s.visible));

  jump(e: Event, id: string) {
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
}
