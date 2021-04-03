
import * as FileSystem from "fs";
import { strict as Assert } from 'assert';
import main from '../../../../lib/server/inline-main.mjs';

// const counter = 0;

// const onError = (error) => {
//   console.log(error.message);
//   // counter += 1;
// };

const path = "tmp/test/foo.js";

FileSystem.writeFileSync(
  path,
  "({});",
  "utf8"
);

// FileSystem.writeFileSync(
//   "tmp/test/native.mjs",
//   "({});"
// );

main({
  "output-dir": "tmp/appmap/",
  "app-name": "foo",
  "map-name": "bar",
  _: [path]
});

main({
  cjs: true,
  _: [path],
});

main({
  mjs: true,
  _: [path],
});

main({
  cjs: true,
  mjs: true,
  _: [path],
});
