module.exports = function (api) {
  const isTest = api.env("test");
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // Jest runs Babel outside Metro, which never rewrites `import()`; Metro/Hermes
    // handle it natively, but Jest's CJS transform needs it lowered to `require()`.
    plugins: isTest ? ["babel-plugin-dynamic-import-node"] : [],
  };
};
