import { Component, OnDestroy, effect, input, signal } from '@angular/core';

/** Types and deletes each role in a loop. With reduced motion, it simply rotates. */
@Component({
  selector: 'app-typed-text',
  template: `<span>{{ text() }}</span><span class="caret" aria-hidden="true"></span>`,
})
export class TypedText implements OnDestroy {
  readonly words = input<string[]>([]);
  readonly text = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    effect(() => {
      const list = this.words().map((w) => w.trim()).filter(Boolean);
      clearTimeout(this.timer);
      this.text.set(list[0] ?? '');
      if (list.length) this.reduced ? this.rotate(list, 0) : this.tick(list, 0, list[0].length, true, 2200);
    });
  }

  private rotate(list: string[], i: number) {
    this.text.set(list[i % list.length]);
    if (list.length > 1) this.timer = setTimeout(() => this.rotate(list, i + 1), 3000);
  }

  private tick(list: string[], wi: number, ci: number, deleting: boolean, wait = 0) {
    this.timer = setTimeout(() => {
      const word = list[wi % list.length];
      if (!deleting && ci >= word.length) return this.tick(list, wi, ci, true, 2200);
      if (deleting && ci <= 0) return this.tick(list, wi + 1, 0, false, 350);
      ci += deleting ? -1 : 1;
      this.text.set(word.slice(0, ci));
      this.tick(list, wi, ci, deleting, deleting ? 35 : 75);
    }, wait);
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }
}
