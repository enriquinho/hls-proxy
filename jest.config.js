/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  testPathIgnorePatterns: [
    "./node_modules/"
  ]
};