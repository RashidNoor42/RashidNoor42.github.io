import { Component, ElementRef, HostListener, computed, inject, input, signal, viewChild } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { CvData, Project, SectionConfig } from '../core/cv.model';
import { SectionTitle } from './section-title';

@Component({
  selector: 'app-portfolio',
  imports: [SectionTitle],
  template: `
    <section id="portfolio" class="section section-tint" aria-labelledby="portfolio-title">
      <div class="wrap">
        <app-section-title [section]="section()" />
        @if (categories().length > 1) {
          <div class="filters" role="group" aria-label="Filter projects">
            <button type="button" [attr.aria-pressed]="filter() === ''" (click)="filter.set('')">
              All <span class="count">{{ cv().projects.length }}</span>
            </button>
            @for (c of categories(); track c.name) {
              <button type="button" [attr.aria-pressed]="filter() === c.name" (click)="filter.set(c.name)">
                {{ c.name }} <span class="count">{{ c.count }}</span>
              </button>
            }
          </div>
        }
        <div class="projects">
          @for (p of visible(); track p.id; let first = $first) {
            <article class="project" [class.featured]="first && visible().length > 2">
              <button type="button" class="project-media" [disabled]="!p.image" (click)="open(p)"
                      [attr.aria-label]="p.image ? 'Enlarge image of ' + p.title : null">
                @if (p.image) {
                  <img [src]="store.img(p.image)" [alt]="" loading="lazy" />
                } @else {
                  <i class="bx bx-code-block" aria-hidden="true"></i>
                }
              </button>
              <div class="project-body">
                @if (p.category) { <p class="project-cat">{{ p.category }}</p> }
                <h3>{{ p.title }}</h3>
                <p>{{ p.description }}</p>
                @if (p.link) {
                  <a class="project-link" [href]="p.link" target="_blank" rel="noopener">View project <i class="bx bx-link-external" aria-hidden="true"></i></a>
                }
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <dialog #dialog class="lightbox" (click)="onBackdrop($event)" (close)="lightbox.set(null)">
      @if (lightbox(); as p) {
        <figure>
          <img [src]="store.img(p.image)" [alt]="p.title" />
          <figcaption>{{ p.title }}</figcaption>
        </figure>
        <button type="button" class="icon-button lightbox-close" aria-label="Close" (click)="dialog.close()"><i class="bx bx-x"></i></button>
      }
    </dialog>
  `,
})
export class Portfolio {
  readonly cv = input.required<CvData>();
  readonly section = input.required<SectionConfig>();
  readonly store = inject(CvStore);
  readonly filter = signal('');
  readonly lightbox = signal<Project | null>(null);
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly categories = computed(() => {
    const map = new Map<string, number>();
    for (const p of this.cv().projects) {
      const c = p.category.trim();
      if (c) map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map].map(([name, count]) => ({ name, count }));
  });

  readonly visible = computed(() => {
    const f = this.filter();
    return f ? this.cv().projects.filter((p) => p.category.trim() === f) : this.cv().projects;
  });

  open(p: Project) {
    this.lightbox.set(p);
    this.dialog().nativeElement.showModal();
  }

  onBackdrop(e: MouseEvent) {
    if (e.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }

  @HostListener('document:keydown.escape')
  esc() {
    this.lightbox.set(null);
  }
}
