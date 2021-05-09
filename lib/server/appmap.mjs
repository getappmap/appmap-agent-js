import * as FileSystem from 'fs';
import * as Path from 'path';
import {assert}from './assert.mjs';
import {logger} from './logger.mjs';
import {isLeft, fromLeft, Left, Right} from "./either.mjs";
import {PushMap} from './push-map.mjs';
import {File} from './file.mjs';
import {instrument} from './instrument/index.mjs';

const VERSION = '1.4';

const navigate = (childeren, name) => {
  for (const child of childeren) {
    if (child.type === 'package' && child.name === name) {
      return child.childeren;
    }
  }
  const child = {
    type: 'package',
    name,
    childeren: [],
  };
  childeren.push(child);
  return child.childeren;
};

const toggle = (appmap, recording, running) => {
  assert(!this.terminated, "terminated appmap");
  if (!appmap.recordings.has(recording)) {
    return new Left(`missing recording ${recording}`);
  }
  recording = appmap.recordings.get(recording);
  if (recording.running === running) {
    return new Left(`recording ${recording} is already in the required state`);
  }
  recording.running = running;
  return new Right(null);
};

const save = (appmap, recording) => {
  assert(this.terminated === false, "non-initialized/terminated appmap %o", appmap);
  if (!appmap.recordings.has(recording)) {
    return new Left(`missing recording ${recording}`);
  }
  {
    const key = recording;
    recording = appmap.recordings.get(key);
    appmap.recordings.delete(key);
  }
  const roots = [];
  for (const origin of recording.origins) {
    const {path, entities} = appmap.origins.get(origin);
    Path.split(Path.dirname(path))
      .reduce(navigate, roots)
      .push({
        type: 'class',
        name: Path.basename(path),
        childeren: entities,
      });
  }
  return new Right(
    {
      content: JSON.stringify({
        version: VERSION,
        metadata: recording.metadata,
        classMap: roots,
        events: recording.events,
      }),
      path: `${appmap.versionning(recording.path)}.appmap.json`
    }
  );
}

const write = ({path, content}) => {
  try {
    FileSystem.writeFileSync(path, content, 'utf8');
  } catch (error) {
    return new Left(`failed to write appmap to file ${path} >> ${error.mesage}`);
  }
  return new Right(null);
};

const writeAsync = ({path, content}) => new Promise((resolve, reject) => {
  FileSystem.writeFile(path, content, 'utf8', (error) => {
    if (error) {
      resolve(new Left(`failed to write appmap to file ${path} >> ${error.mesage}`));
    } else {
      resolve(new Right(null));
    }
  });
});

const checkAllTermination = (eithers) => {
  const failures = eithers.filter(isLeft).map(fromLeft);
  if (failures.length === 0) {
    return new Right(null);
  }
  return new Left(`failed to save some appmaps:${"\n"}  - ${failures.join("\n  - ")}`);
};

export class Appmap {
  constructor(configuration, cache) {
    this.cache = cache;
    this.session = null;
    this.configuration = configuration;
    this.origins = new PushMap();
    this.recordings = new PushMap();
    this.terminated = null;
  }
  initialize (session) {
    assert(this.terminated === null, "initialized/terminated appmap %o", this);
    this.session = session;
    this.terminated = false;
    return session;
  }
  initializeAsync (session) {
    return Promise.resolve(this.initialize(session));
  }
  terminate (reason) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    this.terminated = true;
    return checkAllTermination(
      Array.from(this.recordings.keys()).map((recording) => this.stop(recording)));
  }
  async terminateAsync (reason) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    this.terminated = true;
    return Promise.all(
      Array
        .from(this.recordings.keys())
        .map((recording) => this.stopAsync(recording))
    ).then(checkAllTermination);
  }
  instrument({source, path, content}) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    assert(Path.isAbsolute(path), "expected an absolute path and got %o", path);
    const {enabled, shallow, exclude} = this.configuration.getFileInstrumentation(path);
    if (!enabled) {
      return new Right(content);
    }
    const origin = this.origins.push({
      path,
      entities: null
    });
    return instrument(
      new File(
        this.configuration.getLanguageVersion(),
        source,
        path,
        content,
      ),
      {
        session: this.session,
        origin,
        exclude,
        shallow
      }
    ).mapLeft((message) => {
      this.origins.delete(origin);
      return message;
    }).mapRight(({entities, content}) => {
      this.origins.get(origin).entities = entities;
      for (const recording of this.recordings.values()) {
        if (recording.running && !recording.isClassMapPruned) {
          recording.origins.add(origin);
        }
      }
      return content;
    });
  }
  instrumentAsync () {
    return Promise.resolve(this.instrument());
  }
  start ({data, path}) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    return this.configuration.extendsWithData(data, path).fmap((configuration) => this.recordings.push(
      {
        metadata: configuration.getMetaData(),
        isClassMapPruned: configuration.isClassMapPruned(),
        isEventPruned: configuration.isEventPruned(),
        events: [],
        origins: new Set(),
      }
    ));
  }
  startAsync (data) {
    return Promise.resolve(this.start(data));
  }
  stop (recording) {
    return save(this, recording).bind(write)
  }
  stopAsync (recording) {
    return save(this, recording).bindAsync(writeAsync);
  }
  play(recording) {
    return toggle(this.recordings, recording, true);
  }
  playAsync(data) {
    return Promise.resolve(this.play(data));
  }
  pause(recording) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    return toggle(this.recordings, recording, false);
  }
  pauseAsync(data) {
    return Promise.resolve(this.play(data));
  }
  record({origin, event}) {
    assert(this.terminated === false, "non-initialized/terminated appmap %o", this);
    if (!this.origins.has(origin)) {
      return new Left(`missing origin: ${origin}`);
    }
    for (const recording of this.recordings.values()) {
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
    }
    return new Right(null);
  }
  recordAsync(data) {
    return Promise.resolve(this.record(data));
  }
};
