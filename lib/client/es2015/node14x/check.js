const Util = require("util");

const global_Error = Error;
const global_Reflect_apply = Reflect.apply;
let global_process_exit = process.exit;
const global_process_stderr = process.stderr;
const global_process_stderr_write = process.stderr.write;
const global_undefined = undefined;

const format = (format, values) => {
  const args = [format];
  for (let index = 0; index < values.length; index += 1) {
    args[args.length] = values[index];
  }
  return global_Reflect_apply(Util.format, global_undefined, args);
};

exports.setExitForTesting = (closure) => {
  global_process_exit = closure;
};

// indicates an external error (eg: compatibiliy issue, netwrok failure, invalid configuration)
exports.expect = (boolean, template, ...values) => {
  if (!boolean) {
    global_Reflect_apply(global_process_stderr_write, global_process_stderr, [
      `${new global_Error(format(template, values)).stack}${"\n"}`,
      "utf8",
    ]);
    global_process_exit(123);
  }
};

// indicates an internal error (aka bug)
exports.assert = (boolean, template, ...values) => {
  if (!boolean) {
    throw new global_Error(format(template, values));
  }
};
