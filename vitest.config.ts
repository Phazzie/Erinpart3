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
        'src/adapters/auth/**/*.ts',
        'src/adapters/storage/**/*.ts',
        'src/adapters/sync/**/*.ts',
        'src/adapters/browser/local-storage.provider.ts',
      ],
      exclude: [
        '**/*.spec.ts',
        '**/test-setup.ts',
        '**/types/**',
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 80,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': '.',
    },
  },
});
