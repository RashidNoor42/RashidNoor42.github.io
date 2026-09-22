import { Component, HostListener, afterRenderEffect, computed, inject, signal } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { About } from './about';
import { Contact } from './contact';
import { Hero } from './hero';
import { Portfolio } from './portfolio';
import { Resume } from './resume';
import { SiteNav } from './site-nav';
import { Skills } from './skills';

/** The public CV page. Sections render in the order (and visibility) set in the dashboard. */
@Component({
  selector: 'app-home',
  imports: [SiteNav, Hero, About, Skills, Resume, Portfolio, Contact],
  template: `
    @if (store.data(); as cv) {
      <a class="skip-link" href="#main">Skip to content</a>
      <app-site-nav [sections]="cv.sections" [name]="cv.profile.name" />
      @if (heroVisible()) { <app-hero [cv]="cv" /> }
      <main id="main" tabindex="-1">
        @for (s of body(); track s.id) {
          @switch (s.id) {
            @case ('about') { <app-about [cv]="cv" [section]="s" /> }
            @case ('skills') { <app-skills [cv]="cv" [section]="s" /> }
            @case ('resume') { <app-resume [cv]="cv" [section]="s" /> }
            @case ('portfolio') { <app-portfolio [cv]="cv" [section]="s" /> }
            @case ('contact') { <app-contact [cv]="cv" [section]="s" /> }
          }
        }
      </main>
      <footer class="site-footer">
        <div class="wrap footer-inner">
          <p>© {{ year }} {{ cv.settings.copyrightName || cv.profile.name }}</p>
          @if (cv.settings.footerText) { <p class="footer-text">{{ cv.settings.footerText }}</p> }
          @if (cv.settings.creditText) { <p class="footer-text">{{ cv.settings.creditText }}</p> }
        </div>
      </footer>
      @if (cv.settings.showBackToTop) {
        <button type="button" class="to-top icon-button" [class.show]="showTop()" aria-label="Back to top" (click)="toTop()">
          <i class="bx bx-up-arrow-alt"></i>
        </button>
      }
    } @else if (store.error()) {
      <div class="load-state">
        <h1>The CV couldn't load</h1>
        <p>{{ store.error() }}</p>
        <button type="button" class="button button-primary" (click)="store.load(true)">Try again</button>
      </div>
    } @else {
      <div class="load-state" aria-busy="true"><span class="loader" aria-label="Loading"></span></div>
    }
  `,
})
export class Home {
  readonly store = inject(CvStore);
  readonly showTop = signal(false);
  readonly year = new Date().getFullYear();
  readonly heroVisible = computed(() => !!this.store.data()?.sections.find((s) => s.id === 'hero' && s.visible));
  readonly body = computed(() => (this.store.data()?.sections ?? []).filter((s) => s.visible && s.id !== 'hero'));
  private jumped = false;

  constructor() {
    // Support links like rashidnoor42.github.io/#resume once the content has rendered.
    afterRenderEffect(() => {
      if (!this.store.data() || this.jumped) return;
      this.jumped = true;
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView(), 50);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showTop.set(window.scrollY > 600);
  }

  toTop() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
}
