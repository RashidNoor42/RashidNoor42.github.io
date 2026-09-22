import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { StorageService } from '../core/storage';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  host: { class: 'admin login-page' },
  template: `
    <form class="card login-card" (ngSubmit)="submit()">
      <div class="login-icon"><i class="bx bx-lock-alt"></i></div>
      <h1>CV Dashboard</h1>
      @if (mode === 'local') {
        <p class="muted">Local mode — enter the admin password from your <code>.env.local</code> file.</p>
        <label for="secret">Password</label>
        <input id="secret" type="password" name="secret" autocomplete="current-password" [(ngModel)]="secret" autofocus />
      } @else {
        <p class="muted">
          Paste a GitHub fine-grained token with <strong>Contents: Read and write</strong> access to
          <code>{{ repo }}</code>. Saving commits <code>cv.json</code> to the repo, and GitHub rejects anyone without a valid token.
        </p>
        <label for="secret">GitHub token</label>
        <input id="secret" type="password" name="secret" autocomplete="off" placeholder="github_pat_…" [(ngModel)]="secret" autofocus />
      }
      <label class="check mt">
        <input type="checkbox" name="remember" [(ngModel)]="remember" />
        <span>Remember on this device</span>
      </label>
      @if (error()) { <div class="alert">{{ error() }}</div> }
      <button type="submit" class="btn btn-primary w-100" [disabled]="busy() || !secret">
        {{ busy() ? 'Checking…' : 'Log in' }}
      </button>
      <a routerLink="/" class="back">← Back to site</a>
    </form>
  `,
})
export class Login {
  private storage = inject(StorageService);
  private router = inject(Router);
  readonly mode = this.storage.adapter.mode;
  readonly repo = `${environment.github.owner}/${environment.github.repo}`;
  readonly busy = signal(false);
  readonly error = signal('');
  secret = '';
  remember = false;

  constructor() {
    if (this.storage.adapter.isLoggedIn()) this.router.navigate(['/admin']);
  }

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.storage.adapter.login(this.secret, this.remember);
      this.secret = '';
      this.router.navigate(['/admin']);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.busy.set(false);
    }
  }
}
