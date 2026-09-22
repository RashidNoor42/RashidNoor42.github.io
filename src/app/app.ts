import { Component, effect, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { CvStore } from './core/cv-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private store = inject(CvStore);
  private title = inject(Title);
  private meta = inject(Meta);

  constructor() {
    this.store.load();
    // Apply site-wide settings (title, description, accent colour, hero image) whenever data changes.
    effect(() => {
      const d = this.store.data();
      if (!d) return;
      this.title.setTitle(d.settings.siteTitle || d.profile.name);
      this.meta.updateTag({ name: 'description', content: d.settings.metaDescription || '' });
      const root = document.documentElement.style;
      const accent = /^#[0-9a-f]{6}$/i.test(d.settings.accentColor) ? d.settings.accentColor : '#0563bb';
      root.setProperty('--accent-base', accent);
    });
  }
}
