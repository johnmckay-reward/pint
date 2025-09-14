module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/node_modules/**/*", // Ignore dependencies
  ],
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
    "no-undef": "off", // TypeScript handles this
    "no-unused-vars": "off", // TypeScript handles this
    "no-case-declarations": "off", // Allow declarations in case blocks
  },
};