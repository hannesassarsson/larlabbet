import { defineConfig } from 'vitest/config';

/** Regeltesterna mot Firestore-emulatorn (npm run test:firebase). */
export default defineConfig({
  test: { environment: 'node', include: ['tests-firebase/**/*.test.ts'], fileParallelism: false, testTimeout: 20_000 },
});
