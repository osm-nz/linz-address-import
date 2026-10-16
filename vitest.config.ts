import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15_000,
    globals: true,
    coverage: {
      reporter: ['lcov', 'html'],
      exclude: [
        '*.config.*',
        'src/download',
        'src/upload',
        //
      ],
    },
    onConsoleLog: (log) => !log.includes('Mock Error'),
  },
});
