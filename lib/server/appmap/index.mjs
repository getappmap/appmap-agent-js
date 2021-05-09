
import * as Path from 'path';
import {assert}from '../assert.mjs';
import {isLeft, fromLeft, Left, Right} from "../either.mjs";
import {EitherMap} from '../either-map.mjs';
import {instrument} from '../instrument/index.mjs';
import {File} from './file.mjs';
import {Recording} from "./recording.mjs";

const finalizeTermination = (eithers) => {
  const failures = eithers.filter(isLeft).map(fromLeft);
  if (failures.length === 0) {
    return new Right(null);
  }
  return new Left(`failed to save some appmaps:${"\n"}  - ${failures.join("\n  - ")}`);
};

const prepareTermination = (appmap) => {
  assert(this.session !== null, "non-initialized appmap %o", this);
  assert(!this.terminated, "terminated appmap %o", this);
  this.terminated = true;
  const recordings = Array.from(this.recordings.values());
  this.recordings.clear();
  return recordings;
};

export class Appmap {
  constructor(configuration, versioning) {
    this.versioning = versioning;
    this.session = null;
    this.configuration = configuration;
    this.origins = new EitherMap();
    this.recordings = new EitherMap();
    this.terminated = false;
  }
  initialize (session) {
    assert(this.session === null, "already initialized appmap %o", this);
    this.session = session;
    return session;
  }
  initializeAsync (session) {
    return Promise.resolve(this.initialize(session));
  }
  terminate (reason) {
    return finalizeTermination(prepareTermination(this).map((recording) => recording.terminate(this.versioning)));
  }
  async terminateAsync (reason) {
    return Promise.all(prepareTermination(this).map((recording) => recording.terminate(this.versioning))).then(finalizeTermination);
  }
  instrument({source, path, content}) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    if (!Path.isAbsolute(path)) {
      return new Left(`expected an absoluate path and got: ${path}`);
    }
    const {enabled, shallow, exclude} = this.configuration.getFileInstrumentation(path);
    if (!enabled) {
      return new Right(content);
    }
    const origin = {
      path,
      entities: null
    };
    const key = this.origins.push(origin);
    return instrument(
      new File(
        this.configuration.getLanguageVersion(),
        source,
        path,
        content,
      ),
      {
        session: this.session,
        origin: key,
        exclude,
        shallow
      }
    ).mapLeft((message) => {
      this.origins.delete(key).fromRight();
      return message;
    }).mapRight(({entities, content}) => {
      origin.entities = entities;
      for (const recording of this.recordings.values()) {
        recording.register(origin);
      }
      return content;
    });
  }
  instrumentAsync () {
    return Promise.resolve(this.instrument());
  }
  start ({data, path}) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    return this.configuration.extendsWithData(data, path).mapRight((configuration) =>
      this.recordings.push(new Recording(configuration))
    );
  }
  startAsync (data) {
    return Promise.resolve(this.start(data));
  }
  toggle (key) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    return this.recordings.get(key).mapRight((recording) => recording.toggle());
  }
  toggleAsync (key) {
    return Promise.resolve(this.toogle(key));
  }
  stop (key) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    return this.recordings.take(key).bind((recording) => recording.terminate(this.versioning));
  }
  stopAsync (key) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    return this.recordings.take(key).bindAsync((recording) => recording.terminateAsync(this.versionning));
  }
  record({origin:key, event}) {
    assert(this.session !== null, "non-initialized appmap %o", this);
    assert(!this.terminated, "terminated appmap %o", this);
    return this.origin.get(key).mapRight((origin) => {
      for (const recording of this.recordings.values()) {
        recording.record(origin, event);
      }
      return null;
    });
  }
  recordAsync(data) {
    return Promise.resolve(this.record(data));
  }
};
