module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:react/recommended", "prettier"],
  plugins: ["react", "@typescript-eslint"],
  env: { browser: true, es2021: true, node: true, jest: true },
  settings: { react: { version: "detect" } },
  rules: {},
};
