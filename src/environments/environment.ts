// Production settings (used by `npm run build` and GitHub Pages).
// The dashboard saves by committing cv.json to your GitHub repo.
export const environment = {
  production: true,
  storage: 'github' as 'github' | 'local',
  dataUrl: 'data/cv.json',
  github: {
    owner: 'RashidNoor42',
    repo: 'RashidNoor42.github.io',
    branch: 'main',
    dataPath: 'public/data/cv.json',
    uploadDir: 'public/assets/img/uploads',
  },
};
