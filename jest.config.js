/** @type {import('jest').Config} */
const nextJest = require("next/jest");

const createJestConfig = nextJest.default({
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/*.test.[jt]s?(x)"],
};

module.exports = createJestConfig(config);
