import * as ChildProcess from 'child_process';
import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

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
    logger.warning(
      format(command, 'failed with', result.error.message, result.stderr),
    );
    return null;
  }
  if (result.signal !== null) {
    logger.warning(
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
    logger.warning(`Failed to parse git description, got: ${description}`);
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
    logger.warning(
      format(command, 'exit with status', String(result.status), result.stderr),
    );
    return null;
  }
  return result.stdout.trim();
};

export class Git {
  constructor (path) {
    this.path = path;
  }
  isRepository () => {
    const command = `git -C=${this.path} rev-parse --git-dir`;
    const result = spawnSync(command);
    return result !== null && result.status === 0;
  }
  getRepositoryURL () {
    return run(`git -C=${this.path} config --get remote.origin.url`);
  }
  getBranchName () {
    return run(`git -C=${this.path} rev-parse --abbrev-ref HEAD`);
  }
  getCommitHash () {
    return run(`git -C=${this.path} rev-parse HEAD`);
  }
  getStatus () {
    return run(`git -C=${this.path} status --porcelain`).split('\n').map(trim);
  }
  getLatestTag () {
    return run(`git -C=${this.path} describe --abbrev=0 --tags`);
  }
  getLatestAnnotatedTag () {
    return run(`git -C=${this.path} describe --abbrev=0`);
  }
  getCommitNumberSinceLatestTag () {
    return parseDescription(run(`git -C=${this.path} describe --long --tag`));
  }
  getCommitNumberSinceLatestAnnotatedTag () {
    return parseDescription(run(`git -C=${this.path} describe --long`));
  }
};
