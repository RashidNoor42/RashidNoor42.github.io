import { Injectable, computed, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CvData, validateCv } from './cv.model';
import { StorageService } from './storage';

/**
 * Single source of truth for the CV.
 *  - data():  what the public site renders (last saved version)
 *  - draft:   the copy the dashboard edits; saved with save()
 */
@Injectable({ providedIn: 'root' })
export class CvStore {
  private storage = inject(StorageService);

  readonly data = signal<CvData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Bumped on every draft change so templates and `dirty` refresh. */
  readonly rev = signal(0);
  draft: CvData | null = null;
  private savedJson = '';

  /** Local previews for images uploaded this session (GitHub serves them only after deploy). */
  readonly previews = new Map<string, string>();

  readonly dirty = computed(() => {
    this.rev();
    return !!this.draft && JSON.stringify(this.draft) !== this.savedJson;
  });

  private loaded?: Promise<void>;

  load(force = false): Promise<void> {
    if (this.loaded && !force) return this.loaded;
    this.loading.set(true);
    this.loaded = fetch(`${environment.dataUrl}?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${environment.dataUrl} (${r.status})`);
        return r.json();
      })
      .then((d: CvData) => {
        const problem = validateCv(d);
        if (problem) throw new Error('cv.json is invalid: ' + problem);
        this.data.set(d);
        this.resetDraft();
        this.error.set(null);
      })
      .catch((e) => {
        this.error.set(e.message);
        this.loaded = undefined;
      })
      .finally(() => this.loading.set(false));
    return this.loaded;
  }

  resetDraft() {
    const d = this.data();
    this.savedJson = d ? JSON.stringify(d) : '';
    this.draft = d ? structuredClone(d) : null;
    this.touch();
  }

  touch() {
    this.rev.update((v) => v + 1);
  }

  replaceDraft(d: CvData) {
    this.draft = d;
    this.touch();
  }

  async save(): Promise<string> {
    if (!this.draft) throw new Error('Nothing to save.');
    const problem = validateCv(this.draft);
    if (problem) throw new Error(problem);
    tidy(this.draft);
    this.draft.updatedAt = new Date().toISOString();
    const snapshot = structuredClone(this.draft);
    const msg = await this.storage.adapter.save(snapshot);
    this.data.set(snapshot);
    this.savedJson = JSON.stringify(snapshot);
    this.touch();
    return msg;
  }

  /** Resolves an image path for <img src>, preferring a fresh local preview. */
  img(path: string): string {
    return this.previews.get(path) ?? path;
  }
}

/** Trims string lists (bullet points etc.) and drops empty lines before saving. */
function tidy(node: any): void {
  if (Array.isArray(node)) {
    if (node.length && node.every((x) => typeof x === 'string')) {
      const clean = node.map((x: string) => x.trim()).filter(Boolean);
      node.splice(0, node.length, ...clean);
    } else node.forEach(tidy);
  } else if (node && typeof node === 'object') {
    Object.values(node).forEach(tidy);
  }
}
