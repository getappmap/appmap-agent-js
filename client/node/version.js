const { expect } = require("./check.js");

const global_parseInt = parseInt;
const global_Reflect_apply = Reflect.apply;
const global_String_prototype_split = String.prototype.split;
const global_isNaN = isNaN;
const global_Math_max = Math.max;

const split = (string) =>
  global_Reflect_apply(global_String_prototype_split, string, ["."]);

exports.expectVersion = (name, actual, expected) => {
  const parts1 = split(actual);
  const parts2 = split(expected);
  const length = global_Math_max(parts1.length, parts2.length);
  for (let index = 0; index < length; index += 1) {
    expect(
      index < parts1.length,
      `minimal ${name} version requirement is ${expected} and got: ${actual}`
    );
    if (index >= parts2.length) {
      break;
    }
    const part1 = global_parseInt(parts1[index], 10);
    expect(!global_isNaN(part1), `could not parse ${name} version: ${actual}`);
    const part2 = global_parseInt(parts2[index], 10);
    expect(
      part1 >= part2,
      `minimal ${name} version requirement is ${expected} and got: ${actual}`
    );
    if (part1 > part2) {
      break;
    }
  }
  return null;
};
