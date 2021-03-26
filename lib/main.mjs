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
    prefix: '$',
    ecma: 2015,
    platform: 'node',
    channel: 'local',
    'git-path': process.cwd(),
    _: null,
    ...options,
  };
  if (currated.channel === 'local') {
    process.argv = ['node', ...currated._];
    const namespace = new Namespace(currated.prefix);
    const appmap = new Appmap(
      new Git(currated['git-path']),
      new Settings(process.env),
    );
    global[namespace.getGlobal('APPMAP_OBJECT')] = appmap;
    VirtualMachine.runInThisContext(
      bundle(namespace, {
        ecma: currated.ecma,
        platform: currated.platform,
        channel: currated.channel,
      }),
    );
    const file = new File(currated._[0], currated.ecma, 'script');
    const { content, entities } = instrument(file, namespace);
    entities.forEach((entity) => {
      appmap.addEntity(entity);
    });
    return VirtualMachine.runInThisContext(content);
  }
  logger.error(`Unsupported channel, got: ${currated.channel}`);
  return undefined;
};
