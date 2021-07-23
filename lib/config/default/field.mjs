
import Specifier from './specifier.mjs';
import Child from './child.mjs';

export default (dependencies) => {

  const {util:{identity, resolvePath}, cpu:{getCPUCount}, git:{getGitInformation}} = dependencies;
  const {normalizeChild} = Child(dependencies);
  const {normalizeSpecifier} = Specifier(dependencies);

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

  const normalizeHooks = (hooks) => {
    hooks = { ...hooks };
    for (let key of Reflect.ownKeys(hooks)) {
      if (hooks[key] === true) {
        hooks[key] = {};
      } else if (hooks[key] === false) {
        hooks[key] = null;
      }
    }
    return hooks;
  };

  const normalizeMain = (main) => {
    if (typeof main === 'string') {
      main = { path: main };
    }
    return {
      path: main.path === null ? main.path : resolvePath(main.path),
    };
  };

  const normalizeBase = (base) => {
    if (typeof base === 'string') {
      base = { directory: base };
    }
    const directory = resolvePath(base.directory);
    return {
      directory,
      git: getGitInformation(directory),
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

  const normalizeChilderen = (children) => children.flatMap(normalizeChild);

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
    // runner //
    children: {
      extend: prepend,
      normalize: normalizeChilderen,
      initial: [],
    },
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
    // client //
    recorder: {
      extend: overwrite,
      normalize: identity,
      initial: 'normal',
    },
    source: {
      extend: overwrite,
      normalize: identity,
      initial: false,
    },
    hooks: {
      extend: assign,
      normalize: normalizeHooks,
      initial: {
        esm: {},
        cjs: {},
        http: null,
        mysql: null,
        sqlite3: null,
        pg: null,
      },
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
      initial: null,
    },
    output: {
      extend: assign,
      normalize: normalizeOutput,
      initial: {
        directory: resolvePath(`tmp/appmap`),
        'file-name': null,
      },
    },
    base: {
      extend: overwrite,
      normalize: normalizeBase,
      initial: {
        directory: resolvePath('.'),
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
    expect(key in infos, `invalid field key %o`, key);
    const { normalize, extend } = infos[key];
    extend(data, key, normalize(value));
  };

};
