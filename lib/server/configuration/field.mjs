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

// const normalizeRecorder = (recorder) => {
//   if (typeof recorder === 'string') {
//     recorder = { name: recorder };
//   }
//   return recorder;
// };

const normalizeOutput = (output) => {
  if (typeof output === 'string') {
    output = { directory: output };
  }
  if (Reflect.getOwnPropertyDescriptor(output, 'directory') === undefined) {
    return output;
  }
  return {
    ...output,
    directory: resolvePath(output.directory),
  };
};

const normalizePackageSpecifier = (specifier) => {
  if (typeof specifier === 'string') {
    specifier = { path: specifier };
  }
  specifier = {
    enabled: true,
    shallow: false,
    exclude: [],
    ...specifier,
  };
  return normalizeSpecifier(specifier, {
    enabled: specifier.enabled,
    shallow: specifier.shallow,
    exclude: specifier.exclude,
  });
};

const normalizePackages = (specifiers) =>
  specifiers.map(normalizePackageSpecifier);

const normalizeChilderen = (childeren) => childeren.flatMap(normalizeChild);

const normalizeEnablingSpecifier = (specifier) => {
  if (typeof specifier === 'string') {
    specifier = { path: specifier };
  }
  specifier = {
    enabled: true,
    ...specifier,
  };
  return normalizeSpecifier(specifier, {
    enabled: specifier.enabled,
  });
};

const normalizeEnabled = (specifiers) => {
  if (typeof specifiers === 'boolean') {
    return [
      {
        base: '/',
        pattern: '[\\s\\S]*',
        flags: '',
        data: {
          enabled: specifiers,
        },
      },
    ];
  }
  return specifiers.map(normalizeEnablingSpecifier);
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
    initial: 1,
  },
  childeren: {
    extend: prepend,
    normalize: normalizeChilderen,
    initial: [],
  },
  // client //
  recorder: {
    extend: overwrite,
    normalize: identity,
    initial: 'normal',
  },
  'hook-cjs': {
    extend: overwrite,
    normalize: identity,
    initial: true,
  },
  'hook-esm': {
    extend: overwrite,
    normalize: identity,
    initial: true,
  },
  'hook-http': {
    extend: overwrite,
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
      directory: resolvePath(`tmp${Path.sep}appmap`),
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
  extend(data, key, normalize(value));
};
