import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CvStore } from '../core/cv-store';
import { AuthError, StorageService } from '../core/storage';
import { COLLECTIONS } from './schema';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  host: { class: 'admin' },
  template: `
    <aside class="side" [class.open]="menuOpen()">
      <a routerLink="/admin" class="brand" (click)="menuOpen.set(false)"><i class="bx bx-id-card"></i> CV Dashboard</a>
      <nav>
        <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOpen.set(false)">
          <i class="bx bx-home"></i> Overview</a>
        @for (c of collections; track c.key) {
          <a [routerLink]="['/admin/edit', c.key]" routerLinkActive="active" (click)="menuOpen.set(false)"><i [class]="c.icon"></i> {{ c.label }}</a>
        }
        <a routerLink="/admin/backup" routerLinkActive="active" (click)="menuOpen.set(false)"><i class="bx bx-data"></i> Backup / JSON</a>
      </nav>
      <div class="side-foot">
        <span class="badge" [class.badge-local]="mode === 'local'">
          {{ mode === 'local' ? 'Local mode' : 'GitHub mode' }}
        </span>
        <button type="button" class="btn btn-ghost w-100" (click)="logout()"><i class="bx bx-log-out"></i> Log out</button>
      </div>
    </aside>

    <div class="main-col">
      <header class="topbar">
        <button type="button" class="icon-btn only-mobile" aria-label="Menu" (click)="menuOpen.set(!menuOpen())"><i class="bx bx-menu"></i></button>
        <span class="status" [class.dirty]="store.dirty()">
          {{ store.dirty() ? '● Unsaved changes' : '✓ All changes saved' }}
        </span>
        <div class="spacer"></div>
        <a routerLink="/" class="btn btn-ghost" title="View the public site (shows the last saved version)"><i class="bx bx-show"></i> <span class="hide-sm">View site</span></a>
        <button type="button" class="btn btn-ghost" [disabled]="!store.dirty() || saving()" (click)="discard()"><i class="bx bx-undo"></i> <span class="hide-sm">Discard</span></button>
        <button type="button" class="btn btn-primary" [disabled]="!store.dirty() || saving()" (click)="save()">
          <i class="bx bx-save"></i> {{ saving() ? 'Saving…' : 'Save' }}
        </button>
      </header>

      @if (toast(); as t) {
        <div class="toast" [class.toast-error]="t.error" (click)="toast.set(null)">
          <i class="bx" [class.bx-check-circle]="!t.error" [class.bx-error]="t.error"></i> {{ t.text }}
        </div>
      }

      <main class="content">
        @if (store.draft) {
          <router-outlet />
        } @else if (store.error()) {
          <div class="card empty">{{ store.error() }}</div>
        } @else {
          <div class="card empty">Loading…</div>
        }
      </main>
    </div>
  `,
})
export class AdminShell {
  readonly store = inject(CvStore);
  private storage = inject(StorageService);
  private router = inject(Router);
  readonly collections = COLLECTIONS;
  readonly mode = this.storage.adapter.mode;
  readonly saving = signal(false);
  readonly menuOpen = signal(false);
  readonly toast = signal<{ text: string; error: boolean } | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.store.load();
  }

  notify(text: string, error = false) {
    clearTimeout(this.toastTimer);
    this.toast.set({ text, error });
    this.toastTimer = setTimeout(() => this.toast.set(null), error ? 10000 : 6000);
  }

  async save() {
    (document.activeElement as HTMLElement | null)?.blur(); // commit any field being edited
    this.saving.set(true);
    try {
      this.notify(await this.store.save());
    } catch (e: any) {
      this.notify(e.message, true);
      if (e instanceof AuthError) this.router.navigate(['/admin/login']);
    } finally {
      this.saving.set(false);
    }
  }

  discard() {
    if (confirm('Discard all unsaved changes?')) {
      this.store.resetDraft();
      this.notify('Changes discarded.');
    }
  }

  logout() {
    if (this.store.dirty() && !confirm('You have unsaved changes. Log out anyway?')) return;
    this.storage.adapter.logout();
    this.store.resetDraft();
    this.router.navigate(['/admin/login']);
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnload(e: BeforeUnloadEvent) {
    if (this.store.dirty()) e.preventDefault();
  }
}
