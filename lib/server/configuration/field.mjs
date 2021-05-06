import { getGitInformation } from './git.mjs';
import { resolvePath, getWorkingDirectory } from './cwd.mjs';
import { assert } from '../assert.mjs';
import { makeGroupArray } from './group.mjs';

const identity = (any) => any;

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
  return {
    path: resolvePath(base.path),
    git: getGitInformation(resolvePath(base.path)),
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

const normalizePackages = (specifiers) =>
  specifiers.flatMap((specifier) => {
    if (typeof specifier === 'string') {
      specifier = { glob: specifier };
    }
    specifier = {
      shallow: false,
      enabled: true,
      exclude: [],
      ...specifier,
    };
    return makeGroupArray(specifier, {
      shallow: specifier.shallow,
      enabled: specifier.enabled,
      exclude: specifier.exclude,
    });
  });

const normalizeEnabled = (specifiers) => {
  if (typeof specifiers === 'boolean') {
    return [
      {
        glob: '**/*',
        base: '/',
        data: { enabled: specifiers },
      },
    ];
  }
  if (!Array.isArray(specifiers)) {
    specifiers = [specifiers];
  }
  return specifiers.flatMap((specifier) => {
    if (typeof specifier === 'string') {
      specifier = { glob: specifier };
    }
    specifier = {
      enabled: true,
      ...specifier,
    };
    return makeGroupArray(specifier, { enabled: specifier.enabled });
  });
};

////////////
// fields //
////////////

const infos = {
  __proto__: null,
  // Logic //
  main: {
    extend: overwrite,
    normalize: normalizeMain,
    initial: { path: null },
  },
  'escape-prefix': {
    extend: overwrite,
    normalize: identity,
    initial: 'APPMAP',
  },
  output: {
    extend: assign,
    normalize: normalizeOutput,
    initial: {
      directory: resolvePath('tmp/appmap'),
      filename: null,
    },
  },
  base: {
    extend: overwrite,
    normalize: normalizeBase,
    initial: {
      path: getWorkingDirectory(),
      git: getGitInformation(getWorkingDirectory()),
    },
  },
  enabled: {
    extend: prepend,
    normalize: normalizeEnabled,
    initial: [],
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
  // MetaData //
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
  frameworks: {
    extend: prepend,
    normalize: normalizeFrameworks,
    initial: [],
  },
  recorder: {
    extend: overwrite,
    normalize: normalizeRecorder,
    initial: { name: null },
  },
  recording: {
    extend: overwrite,
    normalize: normalizeRecording,
    initial: {
      'defined-class': null,
      'method-id': null,
    },
  },
};

////////////
// export //
////////////

export const extendField = (fields, name, value) => {
  assert(name in infos, `invalid field name %o`, name);
  const { extend, normalize } = infos[name];
  extend(fields, name, normalize(value));
};

export const makeInitialFieldObject = (name) => {
  const fields = { __proto__: null };
  Reflect.ownKeys(infos).forEach((name) => {
    fields[name] = infos[name].initial;
  });
  return fields;
};
