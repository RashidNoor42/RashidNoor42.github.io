import { Component, inject, signal } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { validateCv } from '../core/cv.model';

@Component({
  selector: 'app-backup',
  template: `
    <div class="page-head">
      <div>
        <h1><i class="bx bx-data"></i> Backup / JSON</h1>
        <p class="muted">cv.json is your database. Download a backup, or restore one (then press Save).</p>
      </div>
    </div>
    <div class="card">
      <div class="row-btns">
        <button type="button" class="btn btn-primary" (click)="download()"><i class="bx bx-download"></i> Download cv.json</button>
        <label class="btn btn-ghost">
          <i class="bx bx-upload"></i> Import JSON file
          <input type="file" accept="application/json,.json" hidden (change)="import($event)" />
        </label>
      </div>
      @if (msg()) { <p class="mt" [class.err]="isError()">{{ msg() }}</p> }
    </div>
    <div class="card">
      <h3>Current draft (read-only)</h3>
      <pre class="json">{{ json() }}</pre>
    </div>
  `,
})
export class Backup {
  readonly store = inject(CvStore);
  readonly msg = signal('');
  readonly isError = signal(false);

  json() {
    this.store.rev();
    return JSON.stringify(this.store.draft, null, 2);
  }

  download() {
    const blob = new Blob([this.json() + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cv-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async import(e: Event) {
    const el = e.target as HTMLInputElement;
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const problem = validateCv(data);
      if (problem) throw new Error(problem);
      this.store.replaceDraft(data);
      this.isError.set(false);
      this.msg.set('Imported into the draft. Review it, then press Save to keep it.');
    } catch (err: any) {
      this.isError.set(true);
      this.msg.set('Import failed: ' + err.message);
    }
  }
}
