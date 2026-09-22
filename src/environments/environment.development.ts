// Development settings (used by `npm start` on your Mac).
// The dashboard saves through the small local server in /server, which writes public/data/cv.json.
// Keep the "github" block identical to environment.ts.
export const environment = {
  production: false,
  storage: 'local' as 'github' | 'local',
  dataUrl: 'data/cv.json',
  github: {
    owner: 'RashidNoor42',
    repo: 'RashidNoor42.github.io',
    branch: 'main',
    dataPath: 'public/data/cv.json',
    uploadDir: 'public/assets/img/uploads',
  },
};
