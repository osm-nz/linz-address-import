import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/setupTests.ts'],
    testTimeout: 15_000,
    globals: true,
    coverage: {
      reporter: ['lcov', 'html'],
      exclude: [
        '*.config.*',
        'src/download',
        'src/upload',
        'src/extraLayers/geodetic',
        'src/extraLayers/linzTopo/*.ts',
      ],
    },
    onConsoleLog: (log) => !log.includes('Mock Error'),
  },
});
