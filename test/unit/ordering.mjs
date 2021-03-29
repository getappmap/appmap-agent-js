export const src = [
  // indep //
  'es2015/node/process-id',
  'es2015/empty-marker',
  'es2015/undefined',
  'es2015/event-counter',
  'es2015/get-now',
  // serialize //
  'es2015/get-identity',
  'es2015/get-class-name',
  'es2015/serialize', // empty-marker
  'es2015/serialize-parameter', // serialize, get-class-name, get-identity
  'es2015/serialize-exception', // empty-marker, serialize, get-class-name, get-identity
  // send //
  'es2015/node/send/local',
  'es2015/node/setup-engine', // send
  'es2015/node/setup-archive', // send, serialize
];

export const lib = [
  'logger',
  'bundle',
  'settings',
  'git',
  'appmap',
  'namespace',
  'file',
  'instrument/location',
  'instrument/visit',
  'instrument/visit-class',
  'instrument/visit-closure',
  'instrument/visit-expression',
  'instrument/visit-identifier',
  'instrument/visit-pattern',
  'instrument/visit-program',
  'instrument/visit-statement',
  'instrument/index',
  'main',
];
