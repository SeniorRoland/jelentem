import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// base: './' so the build works on GitHub Pages under any repo path.
export default defineConfig({
  base: './',
  // The version from package.json, shown in the corner (src/main.ts).
  define: { __APP_VERSION__: JSON.stringify(version) },
});
