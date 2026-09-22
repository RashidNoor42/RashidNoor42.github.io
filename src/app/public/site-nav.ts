import { Component, HostListener, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { SectionConfig } from '../core/cv.model';
import { ThemeService } from './theme';

@Component({
  selector: 'app-site-nav',
  template: `
    <header class="topbar" [class.scrolled]="scrolled()">
      <div class="wrap topbar-inner">
        <a class="wordmark" href="#top" (click)="go($event, 'top')">{{ name() }}</a>
        <nav class="nav-links" [class.open]="open()" aria-label="Sections">
          @for (s of navItems(); track s.id) {
            <a [href]="'#' + s.id" [class.active]="active() === s.id" [attr.aria-current]="active() === s.id ? 'true' : null"
               (click)="go($event, s.id)"><i [class]="s.icon" aria-hidden="true"></i>{{ s.navLabel }}</a>
          }
        </nav>
        <div class="topbar-actions">
          <button type="button" class="icon-button" (click)="theme.toggle()"
                  [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'">
            <i class="bx" [class.bx-sun]="theme.theme() === 'dark'" [class.bx-moon]="theme.theme() !== 'dark'"></i>
          </button>
          <button type="button" class="icon-button menu-button" [attr.aria-expanded]="open()" aria-label="Menu" (click)="toggle($event)">
            <i class="bx" [class.bx-menu]="!open()" [class.bx-x]="open()"></i>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class SiteNav implements OnDestroy {
  readonly sections = input.required<SectionConfig[]>();
  readonly name = input('');
  readonly theme = inject(ThemeService);
  readonly navItems = computed(() => this.sections().filter((s) => s.visible && s.showInNav && s.id !== 'hero'));
  readonly active = signal('');
  readonly open = signal(false);
  readonly scrolled = signal(false);

  go(e: Event, id: string) {
    e.preventDefault();
    const target = id === 'top' ? document.body : document.getElementById(id);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (id === 'top') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    this.setOpen(false);
  }

  toggle(e: Event) {
    e.stopPropagation();
    this.setOpen(!this.open());
  }

  private setOpen(v: boolean) {
    this.open.set(v);
    document.body.classList.toggle('menu-open', v);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (this.open() && !(e.target as HTMLElement).closest('.topbar')) this.setOpen(false);
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.setOpen(false);
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 8);
    const pos = window.scrollY + window.innerHeight * 0.35;
    let current = '';
    for (const s of this.navItems()) {
      const el = document.getElementById(s.id);
      if (el && el.offsetTop <= pos) current = s.id;
    }
    this.active.set(current);
  }

  ngOnDestroy() {
    document.body.classList.remove('menu-open');
  }
}
