import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'shared',
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      include: ['src/**/*.ts'],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: ['src/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@churchthrive/shared': path.resolve(__dirname, './src'),
    },
  },
});
