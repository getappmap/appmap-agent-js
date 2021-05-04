import * as FileSystem from 'fs';
import logger from './logger.mjs';
import File from './file.mjs';
import instrument from './instrument/index.mjs';
import Namespace from './namespace.mjs';
import getFreshKey from "./set-fresh.mjs";

const VERSION = '1.4';

const navigate = (childeren, name) => {
  for (let index = 0; index < childeren.length; index++) {
    const child = childeren[index];
    if (child.type === "package" && child.name === name) {
      return child.childeren;
    }
  }
  const child = {
    type: "package",
    name,
    childeren: []
  };
  childeren.push(child);
  return child.childeren;
};

const take = (collection, key) => {
  const value = collection.get(key);
  collection.delete(key);
  return value;
};

export default (class Appmap {
  constructor(configuration, cache) {
    this.cache = cache;
    this.configuration = configuration;
    this.namespace = new Namespace(configuration.getEscapePrefix());
    this.origins = new Map();
    this.recordings = new Map();
    this.terminated = false;
  }
  instrument(source, path, content) {
    path = Path.resolve(path);
    const instrumentation = this.configuration.getFileInstrumentation(path);
    if (instrumentation === null) {
      return content;
    }
    const origin = getFreshKey(this.origins);
    let entities;
    {entities, content} = instrument(
      {
        file: new File(this.configuration.getLanguageVersion(), source, path, content),
        namespace: this.namespace,
        isNameExcluded: (name) => this.configuration.isNameExcluded(path, name),
        origin
      }
    );
    logger.debug('Appmap new origin %s %s %j', origin, path, entities);
    this.origins.set(origin, {
      path,
      entities
    });
    this.recordings.values().forEach((recording) => {
      if (recording.running) {
        if (!recording.isClassMapPruned) {
          recording.origins.add(origin);
        }
      }
    });
    return content;
  }
  start (configuration) {
    const configuration = this.configuration.extendsWithData(configuration, null);
    const recording = getFreshKey(this.recordings);
    this.recordings.set(recording, this.recordings, {
      metadata: configuration.getMetaData(),
      isClassMapPruned: configuration.isClassMapPruned(),
      isEventPruned: configuration.isEventPruned(),
      events: [],
      origins: new Set();
    });
    return recording;
  }
  save (recording, callback) {
    const roots = [];
    Array.from(recording.origins.keys()).forEach(({path, entities}) => {
      Path.split(Path.dirname(path)).reduce(navigate, roots).push({
        type: "class",
        name: Path.basename(path),
        childeren
      });
    });
    const content = JSON.stringify(
      {
        version: VERSION,
        metadata: recording.metada,
        classMap: roots,
        events: recording.events
      }
    );
    let path = recording.path;
    if (cache.has(path)) {
      let counter = 0;
      while (`${path}-${String(counter)}` in cache) {
        counter += 1;
      }
      path = `${path}-${String(counter)}`;
    }
    cache.add(path);
    path = `${path}.appmap.json`;
    logger.debug(
      'Appmap recording save %s reason = %j',
      path,
      json,
    );
    if (callback === null) {
      FileSystem.writeFileSync(path, content, 'utf8');
    } else {
      FileSystem.writeFile(
        path,
        content,
        'utf8',
        callback
      )
    }
  }
  stop (recording, callback) {
    if (recording === null) {
      if (callback === null) {
        this.recordings.forEach((key, value) => {
          this.recordings.delete(key);
          this.save(key, value, null);
        });
      } else {
        const iterator = this.recordings.entries();
        const step = (error) => {
          if (error) {
            callback(error)
          } else {
            const {done, value:entry} = iterator.next();
            if (done) {
              callback(null);
            } else {
              this.recordings.delete(entry[0]);
              this.save(entry[1], step);
            }
          }
        };
        step(null);
      }
    } else {
      if (this.recordings.has(recording)) {
        const key = recording;
        const value = this.recordings.get(key);
        this.recordings.delete(key);
        this.save(value, callback);
      } else {
        const error = throw new Error("Missing recording");
        if (callback === null) {
          throw error;
        }
        callback(error);
      }
    }
  }
  toggle (recording, running) {
    if (!this.recordings.has(recording)) {
      throw new Error("Missing recording");
    }
    recording = this.recordings.get(recording);
    if (recording.running === running) {
      throw new Error("Recording is already in the required state");
    }
    recording.running = running;
  }
  play (recording) {
    this.toggle(recording, true);
  }
  pause (recording) {
    this.toggle(recording, false);
  }
  record(origin, event) {
    if (!this.origins.has(origin)) {
      throw new Error("Missing origin");
    }
    this.recordings.values().forEach((recording) => {
      if (recording.running) {
        if (recording.isEventPruned) {
          if (recording.origins.has(origin)) {
            logger.debug('recording %s record event %j', recording, event);
            recording.events.push(event);
          }
        } else {
          recording.events.push(event);
          recording.origins.add(origin);
        }
      }
    });
  }
});
