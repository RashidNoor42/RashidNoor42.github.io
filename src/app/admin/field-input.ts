import { Component, inject, input, signal } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { StorageService } from '../core/storage';
import { FieldDef, ICONS } from './schema';

/** Renders one form control for a FieldDef and writes changes straight into the draft object. */
@Component({
  selector: 'app-field-input',
  host: { class: 'field', '[class.wide]': 'def().wide || def().type === "lines" || def().type === "textarea"' },
  template: `
    @let f = def();
    @let v = model()[f.key];
    @if (f.type === 'checkbox') {
      <label class="check">
        <input type="checkbox" [checked]="!!v" (change)="set($any($event.target).checked)" />
        <span>{{ f.label }}</span>
      </label>
    } @else {
      <label [for]="uid">{{ f.label }}</label>
      @switch (f.type) {
        @case ('textarea') {
          <textarea [id]="uid" rows="4" [value]="v ?? ''" [placeholder]="f.placeholder ?? ''" (input)="set(val($event))"></textarea>
        }
        @case ('lines') {
          <textarea [id]="uid" rows="5" [value]="(v ?? []).join('\\n')" [placeholder]="f.placeholder ?? ''"
                    (input)="setLines(val($event))" (blur)="cleanLines()"></textarea>
        }
        @case ('range') {
          <div class="range">
            <input [id]="uid" type="range" [min]="f.min ?? 0" [max]="f.max ?? 100" [value]="v ?? 0" (input)="set(+val($event))" />
            <input type="number" [min]="f.min ?? 0" [max]="f.max ?? 100" [value]="v ?? 0" (input)="set(clamp(+val($event)))" />
          </div>
        }
        @case ('number') {
          <input [id]="uid" type="number" [value]="v ?? ''" (input)="set(+val($event))" />
        }
        @case ('color') {
          <div class="color">
            <input [id]="uid" type="color" [value]="v || '#0563bb'" (input)="set(val($event))" />
            <input type="text" [value]="v ?? ''" (input)="set(val($event))" />
          </div>
        }
        @case ('month') {
          <div class="with-clear">
            <input [id]="uid" type="month" [value]="v ?? ''" (input)="set(val($event))" />
            @if (v) { <button type="button" class="btn-link" (click)="set('')">Clear</button> }
          </div>
        }
        @case ('icon') {
          <div class="icon-pick">
            <i [class]="v"></i>
            <select [id]="uid" (change)="set(val($event))">
              @for (i of icons; track i) { <option [value]="i" [selected]="i === v">{{ i.replace('bx bxl-', '').replace('bx bx-', '') }}</option> }
              @if (v && !icons.includes(v)) { <option [value]="v" selected>{{ v }}</option> }
            </select>
          </div>
        }
        @case ('image') {
          <div class="image-field">
            <div class="thumb">
              @if (v) { <img [src]="store.img(v)" alt="" /> } @else { <i class="bx bx-image"></i> }
            </div>
            <div class="image-controls">
              <input [id]="uid" type="text" [value]="v ?? ''" placeholder="assets/img/… or https://…" (input)="set(val($event))" />
              <div class="row-btns">
                <label class="btn btn-sm" [class.disabled]="uploading()">
                  <i class="bx bx-upload"></i> {{ uploading() ? 'Uploading…' : 'Upload image' }}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden (change)="upload($event)" [disabled]="uploading()" />
                </label>
                @if (v) { <button type="button" class="btn-link" (click)="set('')">Remove</button> }
              </div>
              @if (uploadError()) { <small class="err">{{ uploadError() }}</small> }
            </div>
          </div>
        }
        @default {
          <input [id]="uid" [type]="f.type" [value]="v ?? ''" [placeholder]="f.placeholder ?? ''" (input)="set(val($event))" />
        }
      }
    }
    @if (f.help) { <small class="help">{{ f.help }}</small> }
  `,
})
export class FieldInput {
  readonly def = input.required<FieldDef>();
  readonly model = input.required<Record<string, any>>();
  readonly store = inject(CvStore);
  private storage = inject(StorageService);
  readonly icons = ICONS;
  readonly uploading = signal(false);
  readonly uploadError = signal('');
  readonly uid = 'f' + Math.random().toString(36).slice(2, 8);

  val(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  clamp(n: number) {
    const f = this.def();
    return Math.max(f.min ?? 0, Math.min(f.max ?? 100, isNaN(n) ? 0 : n));
  }

  set(value: unknown) {
    this.model()[this.def().key] = value;
    this.store.touch();
  }

  /** Keep raw lines while typing (so spaces aren't eaten); tidy up when the field loses focus. */
  setLines(text: string) {
    this.set(text.split('\n'));
  }

  cleanLines() {
    const v = this.model()[this.def().key];
    if (Array.isArray(v)) this.set(v.map((l: string) => l.trim()).filter(Boolean));
  }

  async upload(e: Event) {
    const inputEl = e.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;
    this.uploading.set(true);
    this.uploadError.set('');
    try {
      const path = await this.storage.adapter.uploadImage(file);
      this.store.previews.set(path, URL.createObjectURL(file));
      this.set(path);
    } catch (err: any) {
      this.uploadError.set(err.message);
    } finally {
      this.uploading.set(false);
    }
  }
}
