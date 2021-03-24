import * as Vm from 'vm';
import * as Fs from 'fs';

export default (path) => {
  Vm.runInThisContext(Fs.readFileSync(path, 'utf8'), { filename: path });
};
