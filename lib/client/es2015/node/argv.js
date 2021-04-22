const global_Reflect_apply = Reflect.apply;
const global_String_prototype_indexOf = String.prototype.indexOf;
const global_String_prototype_substring = String.prototype.substring;

// https://www.gnu.org/software/libc/manual/html_node/Argument-Syntax.html
// http://docopt.org

// module.cleanupFlagArgument = (argv, key) => {};

// module.cleanupPositionalArgument = (argv, value, isPath) => {};

exports.removeNamedArgument = (argv1, key1, value1, resolve) => {
  const argv2 = [];
  for (let index = 0; index < argv1.length; index += 1) {
    if (argv1[index][0] === "-") {
      const split = global_Reflect_apply(
        global_String_prototype_indexOf,
        argv1[index],
        ["="]
      );
      if (split === -1) {
        if (
          argv1[index] === key1 &&
          argv1.length > index + 1 &&
          argv1[index + 1][0] !== "-" &&
          resolve(argv1[index + 1]) === resolve(value1)
        ) {
          index += 1;
          /* eslint-disable no-continue */
          continue;
          /* eslint-enable no-continue */
        }
      } else {
        const key2 = global_Reflect_apply(
          global_String_prototype_substring,
          argv1[index],
          [0, split]
        );
        const value2 = global_Reflect_apply(
          global_String_prototype_substring,
          argv1[index],
          [split + 1]
        );
        if (key2 === key1 && resolve(value2) === resolve(value1)) {
          /* eslint-disable no-continue */
          continue;
          /* eslint-enable no-continue */
        }
      }
    }
    argv2[argv2.length] = argv1[index];
  }
  return argv2;
};
