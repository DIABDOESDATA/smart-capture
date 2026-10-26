import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'versioned-offline-shell',
      apply: 'build',
      async closeBundle() {
        const root = path.resolve('dist');
        const walk = async (dir: string): Promise<string[]> => {
          const items = await readdir(dir, { withFileTypes: true });
          return (
            await Promise.all(
              items.map((item) =>
                item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]
              )
            )
          ).flat();
        };
        const files = (await walk(root))
          .filter((file) => {
            const rel = path.relative(root, file).split(path.sep).join('/');
            return (
              rel === 'index.html' ||
              rel === 'manifest.json' ||
              /^icon-|^apple-touch-icon/.test(rel) ||
              rel.startsWith('assets/') ||
              /^references\/[^/]+\.png$/.test(rel)
            );
          })
          .sort();
        const hash = createHash('sha256');
        for (const file of files) {
          hash.update(path.relative(root, file));
          hash.update(await readFile(file));
        }
        const source = await readFile('public/sw.js', 'utf8');
        await writeFile(
          path.join(root, 'sw.js'),
          source
            .replace('__BUILD_ID__', hash.digest('hex').slice(0, 16))
            .replace(
              'const ASSETS = [];',
              'const ASSETS = ' +
                JSON.stringify(
                  files.map((file) => './' + path.relative(root, file).split(path.sep).join('/'))
                ) +
                ';'
            )
        );
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || './',
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { port: 3000, host: true },
});
