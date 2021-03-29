import * as ChildProcess from 'child_process';

export const spawnSync = (command) => {
  const result = ChildProcess.spawnSync(
    command.split(' ')[0],
    command.split(' ').slice(1),
    { stdio: 'inherit' },
  );
  if (Reflect.getOwnPropertyDescriptor(result, 'error') !== undefined) {
    throw result.error;
  }
  if (result.signal !== null) {
    throw new Error(`Killed with ${String(result.signal)}`);
  }
  if (result.status !== 0) {
    throw new Error(`Exit status ${String(result.status)}`);
  }
};
