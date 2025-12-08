import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'src/core/models/**/*.ts',
        'src/core/services/**/*.ts',
        'src/adapters/**/*.ts',
      ],
      exclude: [
        'src/**/*.spec.ts',
        'src/test-setup.ts',
        'src/types/**',
      ],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 85,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': '.',
    },
  },
});
