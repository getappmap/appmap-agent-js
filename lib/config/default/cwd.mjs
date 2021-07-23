import * as Path from 'path';
import { assert } from '../assert.mjs';

let cwd = process.cwd();

export const changeWorkingDirectory = (path, callback) => {
  assert(
    path === null || Path.isAbsolute(path),
    'expected an absolute path, got: %j',
    path,
  );
  const save = cwd;
  cwd = path;
  try {
    return callback();
    // c8 vs node12
    /* c8 ignore start */
  } finally {
    /* c8 ignore stop */
    cwd = save;
  }
};

export const getWorkingDirectory = () => cwd;

export const resolvePath = (path) => {
  if (Path.isAbsolute(path)) {
    return Path.resolve(path);
  }
  assert(cwd !== null, 'missing cwd to resolve relative path: %j', path);
  return Path.resolve(cwd, path);
};
