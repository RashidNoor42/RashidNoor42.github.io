import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CvData, SectionConfig } from '../core/cv.model';

/**
 * Contact block. GitHub Pages can't run PHP, so the optional form posts to Formspree (free).
 * Paste your Formspree endpoint in Dashboard → Site settings to show it.
 */
@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  template: `
    <section id="contact" class="section contact" aria-labelledby="contact-title">
      <div class="wrap contact-grid" [class.with-form]="hasForm()">
        <div class="contact-main">
          <h2 id="contact-title">{{ section().title }}</h2>
          @if (section().intro) { <p class="lead">{{ section().intro }}</p> }
          @if (p().email) {
            <div class="email-row">
              <a class="email-big" [href]="'mailto:' + p().email">{{ p().email }}</a>
              <button type="button" class="button button-small" (click)="copy()">
                <i class="bx" [class.bx-copy]="!copied()" [class.bx-check]="copied()" aria-hidden="true"></i>
                {{ copied() ? 'Copied' : 'Copy email' }}
              </button>
            </div>
          }
          <ul class="contact-list">
            @if (p().phone) { <li><i class="bx bx-phone" aria-hidden="true"></i><a [href]="'tel:' + tel()">{{ p().phone }}</a></li> }
            @if (p().city) { <li><i class="bx bx-map" aria-hidden="true"></i>{{ p().city }}</li> }
            @for (l of links(); track l.id) {
              <li><i [class]="l.icon" aria-hidden="true"></i><a [href]="l.url" target="_blank" rel="noopener">{{ l.label }}</a></li>
            }
          </ul>
        </div>

        @if (hasForm()) {
          <form class="contact-form" (ngSubmit)="send()" #f="ngForm" novalidate>
            <label>Name<input name="name" autocomplete="name" required [(ngModel)]="msg.name" /></label>
            <label>Email<input name="email" type="email" autocomplete="email" required email [(ngModel)]="msg.email" /></label>
            <label>Message<textarea name="message" rows="6" required [(ngModel)]="msg.message"></textarea></label>
            <button type="submit" class="button button-primary" [disabled]="f.invalid || status() === 'sending'">
              {{ status() === 'sending' ? 'Sending…' : 'Send message' }}
            </button>
            @if (status() === 'sent') { <p class="form-note ok" role="status">Message sent. I'll reply by email.</p> }
            @if (status() === 'error') { <p class="form-note bad" role="alert">{{ errorText() }}</p> }
          </form>
        }
      </div>
    </section>
  `,
})
export class Contact {
  readonly cv = input.required<CvData>();
  readonly section = input.required<SectionConfig>();
  readonly p = computed(() => this.cv().profile);
  readonly tel = computed(() => this.p().phone.replace(/[^+\d]/g, ''));
  readonly links = computed(() => this.cv().social.filter((s) => s.url && !s.url.startsWith('mailto:')));
  readonly hasForm = computed(() => /^https:\/\/formspree\.io\//.test(this.cv().settings.formspreeEndpoint || ''));
  readonly copied = signal(false);
  readonly status = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  readonly errorText = signal('');
  msg = { name: '', email: '', message: '' };

  async copy() {
    try {
      await navigator.clipboard.writeText(this.p().email);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      location.href = 'mailto:' + this.p().email;
    }
  }

  async send() {
    this.status.set('sending');
    try {
      const res = await fetch(this.cv().settings.formspreeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(this.msg),
      });
      if (!res.ok) throw new Error();
      this.msg = { name: '', email: '', message: '' };
      this.status.set('sent');
    } catch {
      this.errorText.set(`The message didn't send. Email ${this.p().email} directly instead.`);
      this.status.set('error');
    }
  }
}
