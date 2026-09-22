import { Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, signal, viewChild } from '@angular/core';
import { Skill } from '../core/cv.model';
import { ThemeService } from './theme';

interface Node { name: string; level: number; x: number; y: number; r: number; glow: number; }
interface Edge { a: number; b: number; }
interface Packet { edge: Edge; t: number; speed: number; forward: boolean; }

/**
 * Hero visual: your skills as a small service graph.
 * Node size = skill level. Requests travel between services; the node they reach lights up.
 * Pure canvas, no libraries. Static when the visitor prefers reduced motion.
 */
@Component({
  selector: 'app-skill-graph',
  host: { class: 'skill-graph' },
  template: `
    <canvas #canvas role="img" [attr.aria-label]="label()" (pointermove)="hover($event)" (pointerleave)="hovered.set(-1)"></canvas>
    @if (hovered() >= 0 && nodes[hovered()]; as n) {
      <div class="graph-tip" [style.left.px]="n.x" [style.top.px]="n.y - n.r - 12">{{ n.name }} <b>{{ n.level }}%</b></div>
    }
  `,
})
export class SkillGraph implements OnDestroy {
  readonly skills = input<Skill[]>([]);
  readonly hovered = signal(-1);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private host = inject(ElementRef<HTMLElement>);
  private theme = inject(ThemeService);

  nodes: Node[] = [];
  private edges: Edge[] = [];
  private packets: Packet[] = [];
  private w = 0;
  private h = 0;
  private raf = 0;
  private ro?: ResizeObserver;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private ready = false;
  private visible = true;
  private io?: IntersectionObserver;

  label() {
    return 'Skill graph: ' + this.skills().map((s) => `${s.name} ${s.level}%`).join(', ');
  }

  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.ro = new ResizeObserver(() => this.layout());
      this.ro.observe(this.host.nativeElement);
      this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
      this.io.observe(this.host.nativeElement);
      this.layout();
      this.loop();
    });
    effect(() => {
      this.skills();
      if (this.ready) this.layout();
    });
    effect(() => {
      this.theme.theme();
      if (this.ready) requestAnimationFrame(() => this.draw());
    });
  }

  /** Deterministic force layout so the graph looks the same on every visit. */
  private layout() {
    const el = this.canvas().nativeElement;
    const box = this.host.nativeElement.getBoundingClientRect();
    this.w = box.width;
    this.h = box.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(this.w * dpr);
    el.height = Math.round(this.h * dpr);
    el.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const list = this.skills().slice(0, 14);
    const n = list.length;
    const cx = this.w / 2, cy = this.h / 2;
    const scale = Math.min(this.w, this.h);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    const levels = list.map((s) => s.level);
    const lo = Math.min(...levels), hi = Math.max(...levels);
    this.nodes = list.map((s, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 + rand() * 0.6;
      const dist = scale * (0.26 + rand() * 0.14);
      return {
        name: s.name, level: s.level,
        x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        // Size mixes the absolute level with its rank among your skills, so differences are visible.
        r: (6 + (Math.max(0, Math.min(100, s.level)) / 100) * 8 + (hi > lo ? (s.level - lo) / (hi - lo) : 1) * 12) * Math.min(1.25, Math.max(0.75, scale / 520)),
        glow: 0,
      };
    });

    // Edges: each node to its 2 nearest neighbours, plus a ring so it's connected.
    const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const seen = new Set<string>();
    this.edges = [];
    const add = (a: number, b: number) => {
      if (a === b || seen.has(key(a, b))) return;
      seen.add(key(a, b));
      this.edges.push({ a, b });
    };
    this.nodes.forEach((p, i) => {
      this.nodes
        .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
        .filter((o) => o.j !== i)
        .sort((u, v) => u.d - v.d)
        .slice(0, 2)
        .forEach((o) => add(i, o.j));
      if (n > 2) add(i, (i + 1) % n);
    });

    // Relax: springs on edges, repulsion between nodes, pull to centre.
    const pad = Math.max(56, scale * 0.12);
    for (let it = 0; it < 240; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = this.nodes[i], b = this.nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(1, Math.hypot(dx, dy));
        const f = (scale * scale * 0.03) / (d * d);
        a.x -= (dx / d) * f; a.y -= (dy / d) * f; b.x += (dx / d) * f; b.y += (dy / d) * f;
      }
      for (const e of this.edges) {
        const a = this.nodes[e.a], b = this.nodes[e.b];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(1, Math.hypot(dx, dy));
        const f = (d - scale * 0.34) * 0.015;
        a.x += (dx / d) * f; a.y += (dy / d) * f; b.x -= (dx / d) * f; b.y -= (dy / d) * f;
      }
      for (const p of this.nodes) {
        p.x += (cx - p.x) * 0.004; p.y += (cy - p.y) * 0.004;
        p.x = Math.max(pad, Math.min(this.w - pad, p.x));
        p.y = Math.max(pad * 0.6, Math.min(this.h - pad * 0.6, p.y));
      }
    }
    this.packets = [];
    this.draw();
  }

  private loop = () => {
    if (!this.reduced && this.visible && document.visibilityState === 'visible') {
      if (this.edges.length && this.packets.length < Math.min(6, this.edges.length) && Math.random() < 0.04) {
        this.packets.push({
          edge: this.edges[Math.floor(Math.random() * this.edges.length)],
          t: 0, speed: 0.006 + Math.random() * 0.008, forward: Math.random() > 0.5,
        });
      }
      for (const p of this.packets) p.t += p.speed;
      for (const p of this.packets.filter((x) => x.t >= 1)) this.nodes[p.forward ? p.edge.b : p.edge.a].glow = 1;
      this.packets = this.packets.filter((p) => p.t < 1);
      for (const nd of this.nodes) nd.glow *= 0.965;
      this.draw();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw() {
    const el = this.canvas().nativeElement;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue('--ink').trim() || '#122033';
    const muted = css.getPropertyValue('--muted').trim() || '#5b6778';
    const line = css.getPropertyValue('--graph-line').trim() || '#c9d2dc';
    const accent = css.getPropertyValue('--accent').trim() || '#2b5b8c';
    const signal = css.getPropertyValue('--signal').trim() || '#f2c230';
    const surface = css.getPropertyValue('--paper').trim() || '#f2f4f6';
    const hov = this.hovered();

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineWidth = 1;
    for (const e of this.edges) {
      const a = this.nodes[e.a], b = this.nodes[e.b];
      const active = hov === e.a || hov === e.b;
      ctx.strokeStyle = active ? accent : line;
      ctx.globalAlpha = active ? 0.9 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const p of this.packets) {
      const a = this.nodes[p.forward ? p.edge.a : p.edge.b], b = this.nodes[p.forward ? p.edge.b : p.edge.a];
      const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = signal;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }

    ctx.font = '500 12px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    this.nodes.forEach((nd, i) => {
      if (nd.glow > 0.02) {
        ctx.fillStyle = signal;
        ctx.globalAlpha = nd.glow * 0.35;
        ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r + 10 * nd.glow, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = surface;
      ctx.strokeStyle = accent;
      ctx.lineWidth = i === hov ? 2.5 : 1.5;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(nd.x, nd.y, Math.max(2, nd.r * 0.35), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i === hov ? ink : muted;
      ctx.fillText(nd.name, nd.x, nd.y + nd.r + 16);
    });
  }

  hover(e: PointerEvent) {
    const box = this.canvas().nativeElement.getBoundingClientRect();
    const x = e.clientX - box.left, y = e.clientY - box.top;
    const i = this.nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) < n.r + 8);
    if (i !== this.hovered()) {
      this.hovered.set(i);
      this.draw();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.io?.disconnect();
  }
}
