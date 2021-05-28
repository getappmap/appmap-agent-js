const { expect } = require("../../check.js");

exports.makeErrorHandler = (name) => (error) => {
  expect(false, "%s error >> %s", name, error.message);
};
