import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths: works on GitHub Pages under /starfall/ and when embedded elsewhere.
  base: './',
  test: { globals: true, include: ['tests/**/*.test.ts'] },
});
