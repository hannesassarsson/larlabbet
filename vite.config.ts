import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Genererar dist/sw.js efter bygget. Alla filer i dist precachas och
 * cachenamnet bygger på en hash av innehållet, så varje ny version får
 * en egen cache och gamla cacheversioner tas bort vid aktivering.
 */
function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'leklandet-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(full);
        }
      };
      walk(outDir);
      const hash = createHash('sha256');
      const urls: string[] = [];
      for (const file of files.sort()) {
        const rel = relative(outDir, file).split(sep).join('/');
        if (rel === 'sw.js' || rel.startsWith('startup/') || rel === '_redirects' || rel === '_headers') continue;
        hash.update(rel);
        hash.update(readFileSync(file));
        urls.push(rel === 'index.html' ? '/' : '/' + rel);
      }
      const template = readFileSync('scripts/sw.template.js', 'utf8');
      hash.update(template);
      const version = hash.digest('hex').slice(0, 12);
      const sw = template
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(urls, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
      console.log(`\n[sw] leklandet-${version}: ${urls.length} filer precachas`);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  build: { target: ['es2020', 'safari14'] },
  test: { environment: 'node' },
});
