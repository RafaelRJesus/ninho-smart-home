import { readFileSync } from 'node:fs';

const pkg=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
const environment=process.env.APP_ENV||(process.env.RENDER?'production':process.env.NODE_ENV==='test'?'test':'development');

export const buildInfo=Object.freeze({
  name:'Ninho',
  version:pkg.version,
  environment,
  commit:(process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||'local').slice(0,7),
  builtAt:process.env.BUILD_TIMESTAMP||null,
});
