import * as ChildProcess from 'child_process';
import * as Log from './log.mjs';

const options = {
  encoding: 'utf8',
  timeout: 1000,
  stdio: ['ignore', 'pipe', 'pipe'],
};

const trim = (string) => string.trim();

const format = (command, reason, detail, stderr) =>
  `Command failure: ${command} >> ${reason} ${detail}${
    stderr === '' ? '' : `${'\n'}${stderr}`
  }`;

const spawnSync = (command) => {
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    options,
  );
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    Log.warn(
      format(command, 'failed with', result.error.message, result.stderr),
    );
    return null;
  }
  if (result.signal !== null) {
    Log.warn(
      format(command, 'killed with', String(result.signal), result.stderr),
    );
    return null;
  }
  return result;
};

const parseDescription = (description) => {
  if (description === null) {
    return null;
  }
  const parts = /^([^-]*)-([0-9]+)-([a-fA-F0-9]+)/.exec(description);
  if (parts === null) {
    Log.warn(`Failed to parse git description, got: ${description}`);
    return null;
  }
  return parseInt(parts[2], 10);
};

const run = (command) => {
  const result = spawnSync(command);
  if (result === null) {
    return null;
  }
  if (result.status !== 0) {
    Log.warn(
      format(command, 'exit with status', String(result.status), result.stderr),
    );
    return null;
  }
  return result.stdout.trim();
};

export const isRepository = () => {
  const command = 'git rev-parse --git-dir';
  const result = spawnSync(command);
  return result !== null && result.status === 0;
};

export const getRepositoryURL = () => run('git config --get remote.origin.url');

export const getBranchName = () => run('git rev-parse --abbrev-ref HEAD');

export const getCommitHash = () => run('git rev-parse HEAD');

export const getStatus = () =>
  run('git status --porcelain').split('\n').map(trim);

export const getLatestTag = () => run('git describe --abbrev=0 --tags');

export const getLatestAnnotatedTag = () => run('git describe --abbrev=0');

export const getCommitNumberSinceLatestTag = () =>
  parseDescription(run('git describe --long --tag'));

export const getCommitNumberSinceLatestAnnotatedTag = () =>
  parseDescription(run('git describe --long'));
