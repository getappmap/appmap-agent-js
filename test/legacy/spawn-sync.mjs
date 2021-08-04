import * as ChildProcess from 'child_process';

export const spawnSync = (cmd, argv, options) => {
  const result = ChildProcess.spawnSync(cmd, argv, {
    ...options,
    stdio: 'inherit',
  });
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    throw result.error;
  }
  if (result.signal !== null) {
    throw new Error(`Killed with ${String(result.signal)}`);
  }
  if (result.status !== 0) {
    throw new Error(`Error exit code ${String(result.status)}`);
  }
};
