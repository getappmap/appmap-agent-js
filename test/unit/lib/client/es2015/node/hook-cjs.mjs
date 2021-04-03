import { strict as Assert } from 'assert';
import * as FileSystem from  "fs";
import * as Path from "path";
import hookCJS from "../../../../../../lib/client/es2015/node/hook-cjs.js";


const path = Path.resolve("tmp/test/hook-cjs.js");
const content = "module.exports = 123;";

FileSystem.writeFileSync(path, content, "utf8");

hookCJS((...args) => {
  Assert.deepEqual(args, [content, path]);
  return `module.exports = 456;`;
});

import(path).then((module) => {
  Assert.deepEqual(module.default, 456);
});
