const Util = require("util");

const global_Error = Error;
const global_Reflect_apply = Reflect.apply;
let global_process_exit = process.exit;
const global_process_stderr = process.stderr;
const global_process_stderr_write = process.stderr.write;
const global_undefined = undefined;

const format = (template, values) => {
  const args = [template];
  for (let index = 0; index < values.length; index += 1) {
    args[args.length] = values[index];
  }
  return global_Reflect_apply(Util.format, global_undefined, args);
};

let exit = (error) => {
  global_Reflect_apply(global_process_stderr_write, global_process_stderr, [
    `${error.stack}${"\n"}`,
    "utf8",
  ]);
  global_process_exit(123);
};

exports.switchExpectToTestingMode = () => {
  exit = (error) => {
    throw error;
  };
};

exports.expectSuccess = (closure, template, ...values) => {
  try {
    return closure();
  } catch (error) {
    values.push(error.message);
    exit(new global_Error(format(template, values)));
  }
};

// indicates an external error (eg: compatibiliy issue, netwrok failure, invalid configuration)
exports.expect = (boolean, template, ...values) => {
  if (!boolean) {
    exit(new global_Error(format(template, values)));
  }
};

// indicates an internal error (aka bug)
exports.assert = (boolean, template, ...values) => {
  if (!boolean) {
    throw new global_Error(format(template, values));
  }
};
