import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment setup
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
    css: true,

    // Test discovery and execution
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/main.jsx',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      skipFull: true, // Don't report 100% coverage files
      all: true, // Include untested files in report
    },

    // Performance
    testTimeout: 10000,
    hookTimeout: 10000,

    // Output
    reporters: ['default', 'html'],
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});