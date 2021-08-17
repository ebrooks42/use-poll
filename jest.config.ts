/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // The test environment that will be used for testing
  testEnvironment: "jsdom",

  // A list of paths to directories that Jest should use to search for files in.
  roots: ["<rootDir>/src"],

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],
};
