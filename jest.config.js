/**
 * @link
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^dist/(.*)$": "<rootDir>/dist/$1",
  },
  testMatch: ["<rootDir>/__test__/**/*.(spec|test).(j|t)s?(x)"],
  setupFiles: ["<rootDir>/__mock__/index.ts"],
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
  transformIgnorePatterns: [
    "[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|ts|tsx)$",
  ],
}
