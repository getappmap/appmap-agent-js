import * as FileSystem from 'fs';
import * as Path from 'path';
import minimatch from 'minimatch';
import YAML from 'yaml';
import { validateConfigurationData } from './validate.mjs';
import { home } from '../home.js';
import logger from './logger.mjs';
import git from './git.mjs';

const minimatchOptions = {
  nocomment: true
};

const identity = (any) => any;

const resolve = (base, path) => {
  if (Path.isAbsolute(path)) {
    return path;
  }
  if (base === null) {
    throw new Error('missing base to resolve path');
  }
  return Path.resolve(base, path);
};

const npm = JSON.parse(
  FileSystem.readFileSync(Path.join(home, 'package.json'), 'utf8'),
);

////////////////////
// extendWithData //
////////////////////

const makeOverwrite = (key, transform) => (value, object, context) => {
  object[key] = transform(value, context);
  return object;
};

const makeConcat = (key) => (value, object, context) => {
  object[key] = [...object[key], ...value];
  return object;
};

const parseFramework = (framework) => {
  if (typeof framework === "string") {
    const parts = framework.split("@");
    // console.assert(parts.length > 0);
    if (parts.length === 1) {
      return {
        name: framework,
        version: null
      };
    }
    if (parts.length > 2) {
      logger.warning('multiple @ characters in framework: %j', framework);
    }
    return {
      name: parts[0],
      version: parts[1]
    };
  }
  return framework;
};

const getPathDepth = (path) => Path.resolve(path).split('/').length - 1;

const makeGlobs = (specifier, depth) => {
  if (typeof specifier === "string") {
    specifier = {glob:specifier};
  }
  specifier = {
    glob: null,
    path: null,
    dist: null,
    ...specifier
  };
  const globs = [];
  if (specifier.glob !== null) {
    globs.push(specifier.glob);
  }
  if (specifier.path !== null) {
    if (specifier.path.endsWith(".js") || specifier.path.endsWith(".mjs")) {
      globs.push(specifier.path);
    } else if (specifier.path.endsWith("/")) {
      globs.push(`${specifier.path}**/*`);
    } else {
      globs.push(`${specifier.path}/**/*`);
    }
  }
  if (specifier.dist !== null) {
    if (typeof specifier.dist === "string") {
      specifier.dist = {name:specifier.dist};
    }
    let glob = `node_module/${specifier.dist.name}/**/*`;
    if (specifier.dist.deep) {
      glob = `**/${glob}`;
    }
    if (specifier.dist.external) {
      for (let index = 0; index <= depth; index += 1) {
        globs.push(`${'../'.repeat(index)}${glob}`);
      }
    } else {
      globs.push(glob);
    }
  }
  return globs
};

const mergers = {
  __proto__: null,
  extends: (path, data, base) =>
    /* eslint-disable no-use-before-define */
    extendWithFile(data, resolve(base, path)),
  /* eslint-enable no-use-before-define */
  enabled: (specifiers, data, base) => {
    if (typeof specifiers === "boolean") {
      data.enabled = [
        {
          glob: "**/*",
          base: "/",
          enabled: specifiers
        },
        ... data.enabled,
      ];
    } else {
      if (base === null) {
        throw new Error("missing base path for enabled glob");
      }
      if (!Array.isArray(specifiers)) {
        specifiers = [specifiers];
      }
      data.enabled = [
        ... specifiers.flatMap((specifier) => {
          if (typeof specifier === 'string') {
            specifier = { glob: specifier };
          }
          specifier = {
            enabled: true,
            ...specifier,
          };
          return makeGlobs(specifier, getPathDepth(base)).map((glob) => ({
            base,
            glob,
            enabled: specifier.enabled,
          }));
        }),
        ... data.enabled
      ];
    }
    return data;
  },
  packages: (specifiers, data, base) => {
    if (base === null) {
      throw new Error("missing base path for packages glob");
    }
    data.packages = [
      ...specifiers.flatMap((specifier) => {
        if (typeof specifier === 'string') {
          specifier = { glob: specifier };
        }
        specifier = {
          shallow: false,
          enabled: true,
          exclude: [],
          ...specifier,
        };
        return makeGlobs(specifier, getPathDepth(base)).map((glob) => ({
          base,
          glob,
          enabled: specifier.enabled,
          shallow: specifier.shallow,
          exclude: specifier.exclude
        }));
      }),
      ...data.packages,
    ];
    return data;
  },
  frameworks: (frameworks, data, base) => {
    data.frameworks = [
      ... data.frameworks,
      ... frameworks.map(parseFramework)
    ];
    return data;
  },
  exclude: makeConcat('exclude'),
  'main-path': (path, data, base) => {
    data['main-path'] = resolve(base, path);
    return data;
  },
  'base-directory': (path, data, base) => {
    path = resolve(base, path);
    data['base-directory'] = path
    data.git = git(path);
    return data;
  },
  'output-directory': (path, data, base) => {
    data['output-directory'] = resolve(base, path);
    return data;
  },
  'output-file-name': makeOverwrite('output-file-name', identity),
  'app-name': makeOverwrite('app-name', identity),
  name: makeOverwrite('map-name', identity),
  'map-name': makeOverwrite('map-name', identity),
  'language-version': makeOverwrite('language-version', identity),
  'language-engine': makeOverwrite('language-engine', identity),
  'escape-prefix': makeOverwrite('escape-prefix', identity),
  'class-map-pruning': makeOverwrite('class-map-pruning', identity),
  'event-pruning': makeOverwrite('event-pruning', identity),
  labels: makeConcat('labels'),
  feature: makeOverwrite('feature', identity),
  'feature-group': makeOverwrite('feature-group', identity),
  'recorder-name': makeOverwrite('recorder-name', identity),
  'recording-defined-class': makeOverwrite('recording-defined-class', identity),
  'recording-method-id': makeOverwrite('recording-method-id', identity),
};

const extendWithData = (data1, data2, base) => {
  data1 = { ...data1 };
  logger.debug('Configuration extended with data: %j', data2);
  if (base !== null) {
    base = Path.resolve(base);
  }
  Reflect.ownKeys(data2).forEach((key) => {
    data1 = mergers[key](data2[key], data1, base);
  });
  return data1;
};

////////////////////
// extendWithFile //
////////////////////

const parseDefault = () => {
  throw new Error(
    "invalid file extension, expected one of: '.yml', '.yaml', or '.json'",
  );
};

const extendWithFile = (data1, path) => {
  logger.debug('Configuration extended with file: %s', path);
  const content = FileSystem.readFileSync(path, 'utf8');
  let parse;
  if (path.endsWith('.json')) {
    parse = JSON.parse;
  } else if (path.endsWith('.yml') || path.endsWith('.yaml')) {
    parse = YAML.parse;
  } else {
    parse = parseDefault;
  }
  const data2 = parse(content);
  validateConfigurationData(data2);
  return extendWithData(data1, data2, Path.dirname(path));
};

////////////
// Config //
////////////

const getSpecifier = (specifiers, path) => {
  path = Path.resolve(path);
  return specifiers.find(({base, glob}) => minimatch(Path.relative(base, path), glob, minimatchOptions));
};

class Configuration {
  constructor(data) {
    this.data = data;
  }
  extendWithData(data, base) {
    return new Configuration(extendWithData({ ...this.data }, data, base));
  }
  extendWithFile(path) {
    return new Configuration(extendWithFile({ ...this.data }, path));
  }
  isEnabled() {
    if (this.data["main-path"] === null) {
      throw new Error("missing main path for enabled query");
    }
    // console.assert(Path.isAbsolute(this.data["main-path"]));
    return getSpecifier(this.data.enabled, this.data["main-path"]).enabled;
  }
  isClassMapPruned() {
    return this.data['class-map-pruning'];
  }
  isEventPruned () {
    return this.data['event-pruning'];
  }
  getEscapePrefix() {
    return this.data['escape-prefix'];
  }
  getLanguageVersion() {
    return this.data['language-version'];
  }
  getInstrumentation(path) {
    const specifier = getSpecifier(this.data.packages, path);
    if (specifier === undefined) {
      return {
        enabled: false,
        shallow: false,
        exclude: []
      };
    }
    return {
      enabled: specifier.enabled,
      shallow: specifier.shallow,
      exclude: [...specifier.exclude, ...this.data.exclude]
    };
  }
  getPath() {
    let name = null;
    if (this.data['output-file-name'] !== null) {
      name = this.data['output-file-name'];
    } else if (this.data['main-path'] !== null) {
      name = this.data['main-path'];
    } else if (this.data["map-name"] !== null) {
      name = this.data["map-name"];
    } else {
      name = "anonymous";
    }
    // node checks for null bytes so checking for slashes is enough
    name = name.replace(/\//g, '-');
    // console.assert(Path.isAbsolute(this.data["output-directory"]));
    return Path.join(this.data["output-directory"], name);
  }
  getMetaData() {
    return {
      name: this.data['map-name'],
      labels: this.data.labels,
      app: this.data['app-name'],
      feature: this.data.feature,
      feature_group: this.data['feature-group'],
      language: {
        name: 'javascript',
        engine: this.data['language-engine'],
        version: this.data['language-version'],
      },
      frameworks: this.data.frameworks,
      client: {
        name: npm.name,
        url: npm.repository.url,
        version: npm.version,
      },
      recorder: {
        name: this.data['recorder-name'],
      },
      recording: {
        defined_class: this.data['recording-defined-class'],
        method_id: this.data['recording-method-id'],
      },
      git: this.data.git,
    };
  }
}

////////////////////
// Default Config //
////////////////////

const configuration = new Configuration({
  // Logic //
  'main-path': null,
  'escape-prefix': 'APPMAP',
  'output-directory': Path.resolve('tmp', 'appmap'),
  'output-file-name': null,
  'base-directory': process.cwd(),
  enabled: [{
    glob: "**/*",
    base: "/",
    enabled: true
  }],
  packages: [],
  exclude: [],
  'event-pruning': false,
  'class-map-pruning': false,
  // MetaData //
  'app-name': null,
  'map-name': null,
  labels: [],
  feature: null,
  'feature-group': null,
  'language-engine': null,
  'language-version': '2020',
  frameworks: [],
  'recorder-name': null,
  'recording-defined-class': null,
  'recording-method-id': null,
  git: git(process.cwd()),
});

export const getDefaultConfiguration = () => configuration;
