import * as ChildProcess from 'child_process';
import * as FileSystem from 'fs';
import { assert } from '../assert.mjs';
import { logger } from '../logger.mjs';
import { Left, Right } from '../either.mjs';

const trim = (string) => string.trim();

const identity = (any) => any;

const run = (command, path) => {
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    {
      cwd: path,
      encoding: 'utf8',
      timeout: 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  assert(
    Reflect.getOwnPropertyDescriptor(result, 'error') === undefined,
    `unexpected error for command %o and cwd %o >> %o`,
    command,
    path,
    result.error,
  );
  assert(
    result.signal === null,
    `unexpected signal %o for command %o and path %o`,
    result.signal,
    command,
    path,
  );
  if (result.status === 0) {
    return new Right(result.stdout.trim());
  }
  logger.warning(
    `command %o on cwd %o failed with %o >> %o`,
    command,
    path,
    result.status,
    result.stderr,
  );
  return new Left(null);
};

const parseStatus = (stdout) => stdout.split('\n').map(trim);

const parseDescription = (stdout) => {
  const parts = /^([^-]*)-([0-9]+)-/u.exec(stdout);
  assert(parts !== null, `failed to parse git description %o`, stdout);
  return parseInt(parts[2], 10);
};

export const getGitInformation = (path) => {
  let names;
  try {
    names = FileSystem.readdirSync(path);
  } catch (error) {
    logger.warning('failed to read %o >> %s', path, error.message);
    return null;
  }
  if (!names.includes('.git')) {
    logger.warning('not a path to a git directory %o', path);
    return null;
  }
  return {
    repository: run(`git config --get remote.origin.url`, path).fromRight(),
    branch: run(`git rev-parse --abbrev-ref HEAD`, path).fromRight(),
    commit: run(`git rev-parse HEAD`, path).fromRight(),
    status: run(`git status --porcelain`, path)
      .mapRight(parseStatus)
      .fromRight(),
    tag: run(`git describe --abbrev=0 --tags`, path).either(identity, identity),
    annotated_tag: run(`git describe --abbrev=0`, path).either(
      identity,
      identity,
    ),
    commits_since_tag: run(`git describe --long --tags`, path).either(
      identity,
      parseDescription,
    ),
    commits_since_annotated_tag: run(`git describe --long`, path).either(
      identity,
      parseDescription,
    ),
  };
};
