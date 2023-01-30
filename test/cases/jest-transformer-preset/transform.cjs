/* eslint local/no-globals: ["error", "require", "exports"] */
const {
  strict: { equal: assertEqual },
} = require("node:assert");

exports.createTransformer = (options) => {
  assertEqual(options, "options");
  return {
    process: (content, _path, _options) => ({
      code: content.replace(/MAIN/gu, "MAIN_TRANSFORMED"),
      map: null,
    }),
  };
};
