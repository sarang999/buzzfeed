/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Zustand v4 uses ESM exports — transform it through ts-jest
  transformIgnorePatterns: ['node_modules/(?!(zustand)/)'],
};
