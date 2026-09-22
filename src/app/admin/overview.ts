import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CvStore } from '../core/cv-store';
import { StorageService } from '../core/storage';
import { COLLECTIONS } from './schema';

@Component({
  selector: 'app-overview',
  imports: [RouterLink],
  template: `
    <div class="page-head">
      <div>
        <h1>Welcome back{{ name() ? ', ' + name() : '' }} 👋</h1>
        <p class="muted">Pick a section to edit. Nothing goes live until you press <strong>Save</strong>.</p>
      </div>
    </div>
    <div class="tiles">
      @for (c of collections; track c.key) {
        <a class="card tile" [routerLink]="['/admin/edit', c.key]">
          <i [class]="c.icon"></i>
          <strong>{{ c.label }}</strong>
          <small>{{ count(c.key) }}</small>
        </a>
      }
    </div>
    <div class="card note">
      @if (mode === 'local') {
        <strong>Local mode:</strong> Save writes <code>public/data/cv.json</code> on your Mac. To publish, commit and push
        (<code>git add . && git commit -m "Update CV" && git push</code>).
      } @else {
        <strong>GitHub mode:</strong> Save commits <code>public/data/cv.json</code> to your repository. GitHub Actions rebuilds
        the site and the change is live in about 1–2 minutes.
      }
      <br />Last saved: {{ updated() }}
    </div>
  `,
})
export class Overview {
  readonly store = inject(CvStore);
  readonly mode = inject(StorageService).adapter.mode;
  readonly collections = COLLECTIONS;
  readonly name = computed(() => (this.store.rev(), this.store.draft?.profile.name.split(' ')[0] ?? ''));
  readonly updated = computed(() => {
    const u = this.store.data()?.updatedAt;
    return u ? new Date(u).toLocaleString() : '—';
  });

  count(key: string): string {
    const v = (this.store.draft as any)?.[key];
    return Array.isArray(v) ? `${v.length} item${v.length === 1 ? '' : 's'}` : 'Edit details';
  }
}
