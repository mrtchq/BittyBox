import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // DO NOT write into `dist/`. In this checkout `dist` is a tracked symlink
      // that pointed at the LIVE document root (/var/www/bittybox.org/docs), so
      // a plain `vite build` overwrote production with no deploy step, no
      // verification, and no rollback. Output now lands in a local scratch dir;
      // promoting it to the docroot is an explicit, verified step
      // (see ops/BUILD-PARITY.md).
      outDir: '.build',
      emptyOutDir: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
