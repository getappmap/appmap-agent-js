import * as Path from 'path';
import * as OperatingSystem from 'os';
import { getGitInformation } from './git.mjs';
import { resolvePath } from './cwd.mjs';
import { assert } from '../assert.mjs';
import { normalizeSpecifier } from './specifier.mjs';
import { normalizeChild } from './child.mjs';

const identity = (any) => any;

const cpus = OperatingSystem.cpus().length;

////////////
// Extend //
////////////

const assign = (fields, name, value) => {
  fields[name] = {
    ...fields[name],
    ...value,
  };
};

const overwrite = (fields, name, value) => {
  fields[name] = value;
};

const prepend = (fields, name, value) => {
  fields[name] = [...value, ...fields[name]];
};

///////////////
// Normalize //
///////////////

const makeNormalizeSplit = (separator, key1, key2) => (value) => {
  if (typeof value === 'string') {
    const [head, ...tail] = value.split(separator);
    return {
      [key1]: head,
      [key2]: tail.length === 0 ? null : tail.join(separator),
    };
  }
  return value;
};

const normalizeRecording = makeNormalizeSplit(
  '.',
  'defined-class',
  'method-id',
);

const normalizeLanguage = makeNormalizeSplit('@', 'name', 'version');

const normalizeEngine = makeNormalizeSplit('@', 'name', 'version');

const normalizeFrameworksHelper = makeNormalizeSplit('@', 'name', 'version');
const normalizeFrameworks = (frameworks) =>
  frameworks.map(normalizeFrameworksHelper);

const normalizeConcurrency = (concurrency) => {
  if (typeof concurrency === 'string') {
    concurrency = parseInt(concurrency.substring(0, concurrency.length - 1));
    concurrency = Math.floor((cpus * concurrency) / 100);
    concurrency = Math.max(1, concurrency);
  }
  return concurrency;
};

const normalizeMain = (main) => {
  if (typeof main === 'string') {
    main = { path: main };
  }
  return {
    path: resolvePath(main.path),
  };
};

const normalizeBase = (base) => {
  if (typeof base === 'string') {
    base = { path: base };
  }
  const path = resolvePath(base.path);
  return {
    path,
    git: getGitInformation(path),
  };
};

const normalizeRecorder = (recorder) => {
  if (typeof recorder === 'string') {
    recorder = { name: recorder };
  }
  return recorder;
};

const normalizeOutput = (output) => {
  if (typeof output === 'string') {
    output = { 'directory-path': output };
  }
  if (
    Reflect.getOwnPropertyDescriptor(output, 'directory-path') === undefined
  ) {
    return output;
  }
  return {
    ...output,
    'directory-path': resolvePath(output['directory-path']),
  };
};

const normalizePackages = (specifiers) =>
  specifiers.flatMap(normalizeSpecifier);

const normalizeChilderen = (childeren) => childeren.flatMap(normalizeChild);

const normalizeEnabled = (specifiers) => {
  if (typeof specifiers === 'boolean') {
    return [
      {
        base: '/',
        pattern: '.',
        flags: '',
        data: {
          enabled: specifiers,
          shallow: false,
          exclude: [],
        },
      },
    ];
  }
  return specifiers.flatMap(normalizeSpecifier);
};

////////////
// fields //
////////////

const infos = {
  __proto__: null,
  // server //
  protocol: {
    extend: overwrite,
    normalize: identity,
    initial: 'messaging',
  },
  host: {
    extend: overwrite,
    normalize: identity,
    initial: 'localhost',
  },
  port: {
    extend: overwrite,
    normalize: identity,
    initial: 0,
  },
  concurrency: {
    extend: overwrite,
    normalize: normalizeConcurrency,
    initial: Math.max(1, Math.floor(cpus / 2)),
  },
  childeren: {
    extend: prepend,
    normalize: normalizeChilderen,
    initial: [],
  },
  // client //
  recorder: {
    extend: overwrite,
    normalize: normalizeRecorder,
    initial: { name: 'regular' },
  },
  'hook-cks': {
    extends: overwrite,
    normalize: identity,
    initial: true,
  },
  'hook-esm': {
    extends: overwrite,
    normalize: identity,
    initial: true,
  },
  enabled: {
    extend: prepend,
    normalize: normalizeEnabled,
    initial: [],
  },
  'escape-prefix': {
    extend: overwrite,
    normalize: identity,
    initial: 'APPMAP',
  },
  main: {
    extend: overwrite,
    normalize: normalizeMain,
    initial: { path: null },
  },
  language: {
    extend: overwrite,
    normalize: normalizeLanguage,
    initial: {
      name: 'ecmascript',
      version: '2020',
    },
  },
  engine: {
    extend: overwrite,
    normalize: normalizeEngine,
    initial: {
      name: null,
      version: null,
    },
  },
  packages: {
    extend: prepend,
    normalize: normalizePackages,
    initial: [],
  },
  exclude: {
    extend: prepend,
    normalize: identity,
    initial: [],
  },
  // recording //
  recording: {
    extend: overwrite,
    normalize: normalizeRecording,
    initial: {
      'defined-class': null,
      'method-id': null,
    },
  },
  output: {
    extend: assign,
    normalize: normalizeOutput,
    initial: {
      'directory-path': resolvePath(`tmp${Path.sep}appmap`),
      'file-name': null,
    },
  },
  base: {
    extend: overwrite,
    normalize: normalizeBase,
    initial: {
      path: '/',
      git: null,
    },
  },
  'event-pruning': {
    extend: overwrite,
    normalize: identity,
    initial: false,
  },
  'class-map-pruning': {
    extend: overwrite,
    normalize: identity,
    initial: false,
  },
  'app-name': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  'map-name': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  labels: {
    extend: prepend,
    normalize: identity,
    initial: [],
  },
  feature: {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  'feature-group': {
    extend: overwrite,
    normalize: identity,
    initial: null,
  },
  frameworks: {
    extend: prepend,
    normalize: normalizeFrameworks,
    initial: [],
  },
};

////////////
// export //
////////////

export const makeInitialFieldObject = () => {
  const data = { __proto__: null };
  for (const key in infos) {
    data[key] = infos[key].initial;
  }
  return data;
};

export const extendField = (data, key, value) => {
  assert(key in infos, `invalid field key %o`, key);
  const { normalize, extend } = infos[key];
  data[key] = extend(data, key, normalize(value));
};
