const { process } = globalThis;

import { assertEqual } from "../../__fixture__.mjs";

import {
  getTmpPath,
  getTmpUrl,
  getCwdPath,
  getCwdUrl,
  toAbsolutePath,
  convertPathToFileUrl,
  convertFileUrlToPath,
  getPathBasename,
  getPathExtension,
} from "./index.mjs";

const base = getCwdPath(process);

assertEqual(convertPathToFileUrl(base), getCwdUrl(process));

assertEqual(convertFileUrlToPath(getCwdUrl(process)), base);

assertEqual(convertPathToFileUrl(getTmpPath()), getTmpUrl());

assertEqual(convertFileUrlToPath(getTmpUrl()), getTmpPath());

assertEqual(getPathBasename(base), null);

assertEqual(getPathExtension(base), null);

{
  const path = toAbsolutePath("basename.ext.ext", base);
  assertEqual(getPathBasename(path), "basename");
  assertEqual(getPathExtension(path), ".ext.ext");
}

{
  const path = toAbsolutePath("basename", base);
  assertEqual(getPathBasename(path), "basename");
  assertEqual(getPathExtension(path), null);
}
