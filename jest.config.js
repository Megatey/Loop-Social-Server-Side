module.exports = {
  testEnvironment: 'node',
  watchman: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/env.js',
    '!src/infrastructure/database/connection.js',
    '!src/infrastructure/docs/openapi.js',
    '!src/infrastructure/jobs/jobQueue.js',
    '!src/infrastructure/logging/logger.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
};
