import * as FileSystem from 'fs';
import * as Path from 'path';
import YAML from 'yaml';
import { home } from '../../home.js';
import { assert } from '../assert.mjs';
import { validateConfiguration } from '../validate.mjs';
import { Left, Right } from '../either.mjs';
import { resolvePath, changeWorkingDirectory } from './cwd.mjs';
import { lookupNormalizedSpecifierArray } from './specifier.mjs';
import { spawnNormalizedChild } from './child.mjs';
import { extendField, makeInitialFieldObject } from './field.mjs';

const npm = JSON.parse(
  FileSystem.readFileSync(Path.join(home, 'package.json'), 'utf8'),
);

const isEnabledDefault = { enabled: false };

const getInstrumentationDefault = {
  enabled: false,
  shallow: false,
  exclude: [],
};

const parsers = {
  __proto__: null,
  '.json': JSON.parse,
  '.yml': YAML.parse,
  '.yaml': YAML.parse,
};

class Configuration {
  constructor(data) {
    this.data = data;
  }
  extendWithData(data2, path, done = []) {
    assert(Path.isAbsolute(path), 'expected an absolute path, got: %o', path);
    return validateConfiguration(data2).bind((data2) =>
      changeWorkingDirectory(path, () => {
        data2 = { __proto__: null, ...data2 };
        let either;
        if ('extends' in data2) {
          either = this.extendWithFile(resolvePath(data2.extends), done);
          delete data2.extends;
        } else {
          either = new Right(this);
        }
        return either.mapRight(({ data: data1 }) => {
          data1 = { __proto__: null, ...data1 };
          for (const key in data2) {
            extendField(data1, key, data2[key]);
          }
          return new Configuration(data1);
        });
      }),
    );
  }
  extendWithFile(path, done = []) {
    path = Path.resolve(path);
    const parse = parsers[Path.extname(path)];
    if (parse === undefined) {
      return new Left(
        `invalid extension for configuration file ${JSON.stringify(
          path,
        )}, expected one of: ${Reflect.ownKeys(parsers).join(', ')}`,
      );
    }
    if (done.includes(path)) {
      return new Left(
        `detected loop in configuration file hierarchy ${[...done, path]
          .map(JSON.stringify)
          .join(' -> ')}`,
      );
    }
    let content;
    try {
      content = FileSystem.readFileSync(path, 'utf8');
    } catch (error) {
      return new Left(
        `failed to read configuration file ${path} >> ${error.message}`,
      );
    }
    let data;
    try {
      data = parse(content);
    } catch (error) {
      return new Left(
        `failed to parse configuration file ${path} >> ${error.message}`,
      );
    }
    return this.extendWithData(data, Path.dirname(path), [...done, path]);
  }
  isEnabled() {
    if (this.data.main.path === null) {
      return new Left('missing main path for availability query');
    }
    return new Right(
      lookupNormalizedSpecifierArray(
        this.data.enabled,
        this.data.main.path,
        isEnabledDefault,
      ).enabled,
    );
  }
  isClassMapPruned() {
    return this.data['class-map-pruning'];
  }
  isEventPruned() {
    return this.data['event-pruning'];
  }
  getEscapePrefix() {
    return this.data['escape-prefix'];
  }
  getLanguageVersion() {
    return this.data.language.version;
  }
  getInstrumentation(path) {
    const { enabled, shallow, exclude } = lookupNormalizedSpecifierArray(
      this.data.packages,
      path,
      getInstrumentationDefault,
    );
    return {
      enabled,
      shallow,
      exclude: [...exclude, ...this.data.exclude],
    };
  }
  getBasePath() {
    return this.data.base.path;
  }
  getOutputPath() {
    let filename = 'anonymous';
    if (this.data.output['file-name'] !== null) {
      filename = this.data.output['file-name'];
    } else if (this.data.main.path !== null) {
      filename = this.data.main.path.replace(/\//g, '-');
    } else if (this.data['map-name'] !== null) {
      filename = this.data['map-name'].replace(/\//g, '-');
    }
    return Path.join(this.data.output['directory-path'], filename);
  }
  getMetaData() {
    return {
      name: this.data['map-name'],
      labels: this.data.labels,
      app: this.data['app-name'],
      feature: this.data.feature,
      feature_group: this.data['feature-group'],
      language: {
        name: this.data.language.name,
        version: this.data.language.version,
        engine:
          this.data.engine.name === null
            ? null
            : `${this.data.engine.name}@${this.data.engine.version}`,
      },
      frameworks: this.data.frameworks,
      client: {
        name: npm.name,
        url: npm.repository.url,
        version: npm.version,
      },
      recorder: this.data.recorder,
      recording: this.data.recording,
      git: this.data.base.git,
    };
  }
  getHooking() {
    return {
      esm: this.data['hook-esm'],
      cjs: this.data['hook-cjs'],
    };
  }
  getConcurrency() {
    return this.data.concurrency;
  }
  getProtocol() {
    return this.data.protocol;
  }
  getHost() {
    return this.data.host;
  }
  getPort() {
    return this.data.port;
  }
  getChilderen() {
    return this.data.childeren;
  }
  spawnChild(child) {
    return spawnNormalizedChild(child, this);
  }
}

const configuration = new Configuration(makeInitialFieldObject());

export const getInitialConfiguration = () => configuration;
