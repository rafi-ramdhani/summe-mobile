// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // TanStack Form's Field/AppField use `children` as a render-prop
      // (`children={(field) => ...}`), which is its idiomatic API and matches
      // summe-web verbatim. Disable the rule that flags this pattern.
      "react/no-children-prop": "off",
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
