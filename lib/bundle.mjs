import * as Path from 'path';
import * as FileSystem from 'fs';
import * as Url from 'url';
import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const dirname = Path.dirname(new Url.URL(import.meta.url).pathname);

const normalize = {
  __proto__: null,
  1: '1',
  2: '2',
  3: '3',
  5: '5',
  5.1: '5.1',
  6: '2015',
  7: '2016',
  8: '2017',
  9: '2018',
  10: '2019',
  11: '2020',
  2015: '2015',
  2016: '2016',
  2017: '2017',
  2018: '2018',
  2019: '2019',
  2020: '2020',
};

const support = {
  __proto__: null,
  5: 'es5',
  2015: 'es2015',
  2016: 'es2015',
  2017: 'es2015',
  2018: 'es2015',
  2019: 'es2015',
  2020: 'es2015',
};

export default (namespace, options) => {
  const currated = {
    ecmascript: '2015',
    channel: 'local',
    platform: 'node',
    ...options,
  };
  if (!(currated.ecmascript in normalize)) {
    logger.warning(
      `Invalid ecma version defaulting to 2015, got: ${currated.ecmascript}`,
    );
    currated.ecmascript = '2015';
  } else {
    currated.ecmascript = normalize[currated.ecmascript];
  }
  let basename;
  if (!(currated.ecmascript in support)) {
    logger.warning(
      `Unsupported ecma version defaulting to 2015, got: ${currated.ecmascript}`,
    );
    basename = 'es2015';
  } else {
    basename = support[currated.ecmascript];
  }
  basename = Path.join(dirname, '..', 'src', basename);
  return [
    Path.join(currated.platform, 'send', `${currated.channel}.js`),
    Path.join(currated.platform, 'setup-engine.js'),
    Path.join(currated.platform, 'setup-archive.js'),
    'empty-marker.js',
    'event-counter.js',
    'get-identity.js',
    'get-now.js',
    'serialize.js',
  ]
    .map((relative) => FileSystem.readFileSync(Path.join(basename, relative), 'utf8'))
    .join('')
    .replace(/APPMAP_[A-Z_]*/g, (identifier) =>
      namespace.compileGlobalIdentifier(identifier),
    );
};
