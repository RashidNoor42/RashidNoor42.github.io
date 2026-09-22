import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CvData } from './cv.model';

/**
 * A "storage adapter" is the only thing that knows WHERE the JSON lives.
 * Today: local dev server (your Mac) or GitHub (live site).
 * Later: add a SupabaseAdapter / DjangoApiAdapter with the same methods and switch in environment.ts.
 */
export interface StorageAdapter {
  readonly mode: 'local' | 'github';
  login(secret: string, remember: boolean): Promise<void>;
  logout(): void;
  isLoggedIn(): boolean;
  /** Persists the whole document. Returns a human-readable success message. */
  save(data: CvData): Promise<string>;
  /** Stores an image and returns the path to use in cv.json (e.g. assets/img/uploads/x.jpg). */
  uploadImage(file: File): Promise<string>;
}

export class AuthError extends Error {}

const KEY = 'cv-admin-token';

function readToken(): string | null {
  return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY);
}
function writeToken(t: string, remember: boolean) {
  (remember ? localStorage : sessionStorage).setItem(KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem(KEY);
}

export const ALLOWED_IMAGE = /\.(jpe?g|png|webp|gif)$/i;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function safeName(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-');
  return `${Date.now()}-${clean}`;
}

function checkImage(file: File) {
  if (!ALLOWED_IMAGE.test(file.name)) throw new Error('Only JPG, PNG, WEBP or GIF images are allowed.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image is larger than 5 MB.');
}

/* ------------------------------------------------------------------ */
/* Local adapter: talks to server/dev-server.mjs through /api (proxy)  */
/* ------------------------------------------------------------------ */
class LocalAdapter implements StorageAdapter {
  readonly mode = 'local' as const;

  private async call(path: string, init: RequestInit = {}) {
    const token = readToken();
    let res: Response;
    try {
      res = await fetch('/api' + path, {
        ...init,
        headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
    } catch {
      throw new Error('Local API not reachable. Start everything with "npm start".');
    }
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      clearToken();
      throw new AuthError(body.error || 'Session expired. Please log in again.');
    }
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
    return body;
  }

  async login(password: string, remember: boolean) {
    const r = await this.call('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch((e) => {
      throw e instanceof AuthError ? new Error('Wrong password.') : e;
    });
    writeToken(r.token, remember);
  }

  logout() {
    const token = readToken();
    if (token) fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    clearToken();
  }

  isLoggedIn() {
    return !!readToken();
  }

  async save(data: CvData) {
    await this.call('/cv', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return 'Saved to public/data/cv.json on your computer. Commit & push to publish it.';
  }

  async uploadImage(file: File) {
    checkImage(file);
    const r = await this.call('/upload?name=' + encodeURIComponent(file.name), {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });
    return r.path as string;
  }
}

/* ------------------------------------------------------------------ */
/* GitHub adapter: commits cv.json via the GitHub REST API             */
/* ------------------------------------------------------------------ */
class GitHubAdapter implements StorageAdapter {
  readonly mode = 'github' as const;
  private cfg = environment.github;

  private async gh(path: string, init: RequestInit = {}, token = readToken()) {
    const res = await fetch('https://api.github.com' + path, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new AuthError('GitHub rejected the token (expired or revoked).');
    }
    if (!res.ok) {
      const hint = res.status === 403 || res.status === 404
        ? ' Check that the token has "Contents: Read and write" access to this repository.'
        : '';
      throw new Error((body.message || `GitHub error ${res.status}.`) + hint);
    }
    return body;
  }

  async login(token: string, remember: boolean) {
    token = token.trim();
    if (!token) throw new Error('Paste your GitHub token.');
    const user = await this.gh('/user', {}, token).catch((e) => {
      throw e instanceof AuthError ? new Error('Invalid GitHub token.') : e;
    });
    if (String(user.login).toLowerCase() !== this.cfg.owner.toLowerCase()) {
      throw new Error(`This token belongs to "${user.login}", not the site owner.`);
    }
    const repo = await this.gh(`/repos/${this.cfg.owner}/${this.cfg.repo}`, {}, token);
    if (repo.permissions && repo.permissions.push === false) {
      throw new Error('This account cannot push to the repository.');
    }
    writeToken(token, remember);
  }

  logout() {
    clearToken();
  }

  isLoggedIn() {
    return !!readToken();
  }

  private async putFile(path: string, base64: string, message: string) {
    const url = `/repos/${this.cfg.owner}/${this.cfg.repo}/contents/${path}`;
    let sha: string | undefined;
    try {
      const existing = await this.gh(`${url}?ref=${encodeURIComponent(this.cfg.branch)}`);
      sha = existing.sha;
    } catch (e: any) {
      if (e instanceof AuthError) throw e;
      if (!/not found/i.test(e.message)) throw e; // new file: no sha needed
    }
    try {
      await this.gh(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: base64, branch: this.cfg.branch, ...(sha ? { sha } : {}) }),
      });
    } catch (e) {
      if (e instanceof AuthError) clearToken();
      throw e;
    }
  }

  async save(data: CvData) {
    const json = JSON.stringify(data, null, 2) + '\n';
    await this.putFile(this.cfg.dataPath, utf8ToBase64(json), 'Update CV content via dashboard');
    return 'Committed to GitHub. The live site updates in about 1–2 minutes (after the deploy action finishes).';
  }

  async uploadImage(file: File) {
    checkImage(file);
    const name = safeName(file.name);
    const b64 = await fileToBase64(file);
    await this.putFile(`${this.cfg.uploadDir}/${name}`, b64, `Upload image ${name} via dashboard`);
    return `assets/img/uploads/${name}`;
  }
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = () => reject(new Error('Could not read the file.'));
    r.readAsDataURL(file);
  });
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly adapter: StorageAdapter = environment.storage === 'local' ? new LocalAdapter() : new GitHubAdapter();
}
