import type { Config } from 'jest';

const baseTransform = {
  '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] as [
    string,
    Record<string, unknown>,
  ],
};

const baseModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/src/$1',
};

/**
 * Two projects matching the standard testing pyramid:
 *
 *   unit         No I/O, mocked dependencies. Live next to source as
 *                `*.spec.ts` files.
 *   integration  Real DB. Both repository-level tests and full
 *                controller-flow tests live in `test/integration/**`
 *                as `*.int-spec.ts`.
 *
 * `pnpm test` (api workspace) runs both projects in band.
 *
 * "e2e" in the standard testing pyramid means a full user journey
 * through the UI — that's Playwright on the frontend, configured later.
 * Backend "controller → DB" is integration, not e2e.
 */
const config: Config = {
  rootDir: '.',
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testRegex: 'src/.*\\.spec\\.ts$',
      transform: baseTransform,
      moduleNameMapper: baseModuleNameMapper,
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testRegex: 'test/integration/.*\\.int-spec\\.ts$',
      transform: baseTransform,
      moduleNameMapper: baseModuleNameMapper,
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],
  testTimeout: 60_000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/migrations/**',
    '!src/**/index.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
};

export default config;
