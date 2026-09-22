const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2022-02' -> 'Feb 2022' */
export function formatMonth(v: string): string {
  if (!v) return '';
  const [y, m] = v.split('-').map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : String(y);
}

export function formatPeriod(start: string, end: string): string {
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : 'Present';
  return s ? `${s} - ${e}` : e;
}

/** '1998-11-10' -> '10 November 1998' */
export function formatDate(v: string): string {
  if (!v) return '';
  const d = new Date(v + 'T00:00:00');
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ageFrom(v: string): number | null {
  const d = new Date(v + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

/** Newest first: ongoing items (no end) on top, then by end/start date. */
export function byRecent<T extends { start: string; end: string }>(a: T, b: T): number {
  const ka = (a.end || '9999-99') + a.start;
  const kb = (b.end || '9999-99') + b.start;
  return kb.localeCompare(ka);
}
