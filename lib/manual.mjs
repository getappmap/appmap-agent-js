const { makeOptions } = require("./options.js");
const { makeAppmap, makeAppmapAsync } = require("../appmap.js");

const global_Object_assign = Object.assign;

const common = (callback) => (configuration) => {
  const options = makeOptions(process);
  options.configuration = global_Object_assign(
    {
      cwd: process.cwd(),
      extends: options.configuration,
    },
    configuration,
  );
  return callback(options);
};

exports.makeAppmap = common(makeAppmap);

exports.makeAppmapAsync = common(makeAppmapAsync);
