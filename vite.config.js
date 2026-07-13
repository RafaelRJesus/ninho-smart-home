import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8'));
const commit=process.env.RENDER_GIT_COMMIT||process.env.GITHUB_SHA||(()=>{try{return execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{return 'local';}})();
const environment=process.env.APP_ENV||(process.env.RENDER?'production':process.env.NODE_ENV==='test'?'test':'development');

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION':JSON.stringify(pkg.version),
    'import.meta.env.VITE_BUILD_SHA':JSON.stringify(commit.slice(0,7)),
    'import.meta.env.VITE_APP_ENV':JSON.stringify(environment),
  },
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
