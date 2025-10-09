module.exports = {
  // Coverage configuration
  coverageDirectory: './coverage/',
  collectCoverage: false, // Disabled by default for faster development
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/stories/*', // Exclude Storybook stories from coverage
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/entry.js',
    '<rootDir>/src/entry-dev.js',
    '<rootDir>/src/logout.js',
  ],

  // Test environment
  testEnvironment: 'jsdom',

  // File transformation
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: [],

  // Test setup
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.js'],
  roots: ['<rootDir>/src/'],

  // Module handling
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
};