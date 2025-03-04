module.exports = {
    testEnvironment: 'jsdom', // For browser-like environment
    setupFilesAfterEnv: ['<rootDir>/setupTests.js'], // Optional: For global test setup
    transform: {
    '^.+\\.(js|jsx)$': 'babel-jest', // Use babel-jest to transform JS/JSX files
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1', // Optional: For alias support
    },
  };