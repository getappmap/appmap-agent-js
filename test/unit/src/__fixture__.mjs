import * as VirtualMachine from 'vm';
import * as FileSystem from 'fs';

export const load = (path) => {
  VirtualMachine.runInThisContext(FileSystem.readFileSync(path, 'utf8'), { filename: path });
};
