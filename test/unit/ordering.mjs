export const server = [
  // 'assert',
  // 'logger',
  // 'either',
  // 'either-map',
  // 'validate',
  // 'configuration/cwd',
  // 'configuration/git',
  // 'configuration/specifier',
  // 'configuration/child',
  // 'configuration/field',
  // 'configuration/index',
  // 'instrument/location',
  // 'instrument/visit',
  // 'instrument/visit-class',
  // 'instrument/visit-closure',
  // 'instrument/visit-expression',
  // 'instrument/visit-identifier',
  // 'instrument/visit-pattern',
  // 'instrument/visit-program',
  // 'instrument/visit-statement',
  // 'instrument/index',
  // 'appmap/file',
  'appmap/recording',
  'appmap/index',
  'dispatching',
  'protocol/messaging',
  'protocol/http1',
  'protocol/http2',
  'protocol/index',
  'main',
  'inline',
];

export const client = [
  'node/check',
  'node/version',
  'node/channel/request/messaging',
  'node/channel/request/curl',
  'node/channel/request/http1',
  'node/channel/request/http2',
  'node/channel/request-async/error',
  'node/channel/request-async/messaging',
  'node/channel/request-async/http1',
  'node/channel/request-async/http2',
  'node/channel/index',
  'node/hook/cjs',
  'node/hook/esm',
  'node/hook/http',
  'node/hook/home',
  'node/hook/pg',
  'node/hook/mysql',
  'node/hook/sqlite3',
  'node/hook/index',
  'node/run',
  'node/runtime',
  'node/recording',
  'node/thread',
  'node/appmap',
  'node/recorder/options',
  'node/recorder/normal-main',
  'node/recorder/normal-bin',
  'node/recorder/mocha-main',
  'node/recorder/mocha-bin',
  'node/recorder/empty-main',
];
