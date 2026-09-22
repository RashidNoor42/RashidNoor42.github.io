import { Component, computed, inject, input, signal } from '@angular/core';
import { CvStore } from '../core/cv-store';
import { byRecent } from '../core/format';
import { FieldInput } from './field-input';
import { collection } from './schema';

/** One generic editor for every section — driven by COLLECTIONS in schema.ts. */
@Component({
  selector: 'app-editor',
  imports: [FieldInput],
  template: `
    @if (def(); as d) {
      <div class="page-head">
        <div>
          <h1><i [class]="d.icon"></i> {{ d.label }}</h1>
          <p class="muted">{{ d.description }}</p>
        </div>
        <div class="head-actions">
          @if (d.sortableByDate) {
            <button type="button" class="btn btn-ghost" (click)="sortByDate()"><i class="bx bx-sort-down"></i> Sort newest first</button>
          }
          @if (d.canAdd) {
            <button type="button" class="btn btn-primary" (click)="add()"><i class="bx bx-plus"></i> Add</button>
          }
        </div>
      </div>

      @if (d.kind === 'object') {
        <div class="card">
          <div class="form-grid">
            @for (f of d.fields; track f.key) { <app-field-input [def]="f" [model]="obj()" /> }
          </div>
        </div>
      } @else {
        @if (!list().length) {
          <div class="card empty">Nothing here yet. Click <strong>Add</strong> to create the first item.</div>
        }
        @for (item of list(); track item.id ?? $index; let i = $index, first = $first, last = $last) {
          <div class="card item" [class.open]="openId() === key(item, i)">
            <div class="item-head" (click)="toggle(key(item, i))">
              <i class="bx" [class.bx-chevron-down]="openId() !== key(item, i)" [class.bx-chevron-up]="openId() === key(item, i)"></i>
              <div class="item-title">
                <strong>{{ d.itemLabel ? d.itemLabel(item) : 'Item ' + (i + 1) }}</strong>
                @if (d.itemSub) { <small>{{ d.itemSub(item) }}</small> }
              </div>
              <div class="item-actions" (click)="$event.stopPropagation()">
                <button type="button" class="icon-btn" title="Move up" [disabled]="first" (click)="move(i, -1)"><i class="bx bx-chevron-up"></i></button>
                <button type="button" class="icon-btn" title="Move down" [disabled]="last" (click)="move(i, 1)"><i class="bx bx-chevron-down"></i></button>
                @if (d.canRemove) {
                  <button type="button" class="icon-btn danger" title="Delete" (click)="remove(i)"><i class="bx bx-trash"></i></button>
                }
              </div>
            </div>
            @if (openId() === key(item, i)) {
              <div class="form-grid">
                @for (f of d.fields; track f.key) { <app-field-input [def]="f" [model]="item" /> }
              </div>
            }
          </div>
        }
      }
    } @else {
      <div class="card empty">Unknown section.</div>
    }
  `,
})
export class Editor {
  /** Bound from the route param via withComponentInputBinding(). */
  readonly section = input.required<string>();
  readonly store = inject(CvStore);
  readonly def = computed(() => collection(this.section()));
  readonly openId = signal<string | null>(null);

  obj(): Record<string, any> {
    return (this.store.draft as any)[this.def()!.key];
  }

  list(): any[] {
    return (this.store.draft as any)[this.def()!.key] ?? [];
  }

  key(item: any, i: number): string {
    return item.id ?? String(i);
  }

  toggle(k: string) {
    this.openId.set(this.openId() === k ? null : k);
  }

  add() {
    const item = this.def()!.newItem!();
    this.list().unshift(item);
    this.openId.set(item.id);
    this.store.touch();
  }

  remove(i: number) {
    const item = this.list()[i];
    const name = this.def()!.itemLabel?.(item) ?? 'this item';
    if (!confirm(`Delete "${name}"?`)) return;
    this.list().splice(i, 1);
    this.store.touch();
  }

  move(i: number, dir: -1 | 1) {
    const l = this.list();
    [l[i], l[i + dir]] = [l[i + dir], l[i]];
    this.store.touch();
  }

  sortByDate() {
    this.list().sort(byRecent);
    this.store.touch();
  }
}
