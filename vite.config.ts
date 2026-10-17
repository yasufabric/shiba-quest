import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/shiba-quest/',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
