
import {noop} from "./basic/index.mjs";
import {format} from "./format.mjs";

const level = (
  typeof process !== undefined &&
  Reflect.getOwnPropertyDescriptor(process.env, "APPMAP_LOG") !== undefined
);

export const log = level ? (template, ... values) => {
  console.log(format(template, values));
} : noop;
