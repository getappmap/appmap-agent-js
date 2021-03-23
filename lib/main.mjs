import * as VirtualMachine from 'vm';
import Logger from './logger.mjs';
import Settings from './settings.mjs';
import Git from './git.mjs';
import Namespace from './namespace.mjs';
import bundle from './bundle.mjs';
import Appmap from './appmap.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';

const logger = new Logger(import.meta.url);

export default (options) => {
  const currated = {
    target: null,
    prefix: 'FOO',
    ecma: 2015,
    platform: 'node',
    channel: 'local',
    'git-path': process.cwd(),
    main: undefined,
    _: [],
    ...options,
  };
  if (currated.channel === 'local') {
    process.argv = ['node', currated.main, ...currated._];
    const namespace = new Namespace(currated.prefix);
    global[namespace.getGlobal("APPMAP_OBJECT")] = new Appmap(
      new Git(currated['git-path']),
      new Settings(process.env),
    );
    VirtualMachine.runInThisContext(
      bundle(namespace, {
        ecma: currated.ecma,
        platform: currated.platform,
        channel: currated.channel,
      }),
    );
    const file = new File(currated.target, currated.ecma, 'script');
    return VirtualMachine.runInThisContext(instrument(file, namespace));
  }
  logger.error(`Unsupported channel, got: ${currated.channel}`);
  return undefined;
};
