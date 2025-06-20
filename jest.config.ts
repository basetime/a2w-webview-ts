import type { Config } from '@jest/types';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        // Tests are very slow without this.
        // @see https://stackoverflow.com/a/60905543
        isolatedModules: true,
      },
    ],
  },
  testMatch: ['**/__tests__/*.test.ts?(x)'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
};

export default config;
