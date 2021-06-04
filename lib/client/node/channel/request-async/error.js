const { expect } = require("../../check.js");

/* c8 ignore start */
exports.makeErrorHandler = (name) => (error) => {
  expect(false, "%s error >> %s", name, error.message);
};
/* c8 ignore stop */
