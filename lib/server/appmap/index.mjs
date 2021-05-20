import * as Path from 'path';
import { assert } from '../assert.mjs';
import { forEither, forEitherAsync, Left, Right } from '../either.mjs';
import { EitherMap } from '../either-map.mjs';
import { instrument } from '../instrument/index.mjs';
import { File } from './file.mjs';
import { Recording } from './recording.mjs';

export class Appmap {
  constructor(configuration, versioning) {
    this.versioning = versioning;
    this.session = null;
    this.configuration = configuration;
    this.origins = new EitherMap();
    this.recordings = new EitherMap();
    this.terminated = false;
  }
  initialize(session) {
    assert(this.session === null, 'already initialized appmap %o', this);
    this.session = session;
    return new Right({
      session: session,
      hooking: this.configuration.getHooking(),
    });
  }
  initializeAsync(session) {
    return Promise.resolve(this.initialize(session));
  }
  terminate(reason) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    this.terminated = true;
    return forEither(this.recordings.values(), (recording) =>
      recording.terminate(this.versioning),
    );
  }
  terminateAsync(reason) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    this.terminated = true;
    return forEitherAsync(this.recordings.values(), (recording) =>
      recording.terminateAsync(this.versioning),
    );
  }
  instrument({ source, path, content }) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    if (!Path.isAbsolute(path)) {
      return new Left(`expected an absolute path and got: ${path}`);
    }
    const { enabled, shallow, exclude } = this.configuration.getInstrumentation(
      path,
    );
    if (!enabled) {
      return new Right(content);
    }
    const origin = {
      path,
      entities: null,
    };
    const key = this.origins.push(origin);
    return instrument(
      new File(this.configuration.getLanguageVersion(), source, path, content),
      {
        session: this.session,
        origin: key,
        exclude: new Set(exclude),
        shallow,
      },
    )
      .mapLeft((message) => {
        this.origins.delete(key).fromRight();
        return message;
      })
      .mapRight(({ entities, content }) => {
        origin.entities = entities;
        for (const recording of this.recordings.values()) {
          recording.register(origin);
        }
        return content;
      });
  }
  instrumentAsync(data) {
    return Promise.resolve(this.instrument(data));
  }
  start(data) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.configuration
      .extendWithData(data)
      .mapRight((configuration) =>
        this.recordings.push(new Recording(configuration)),
      );
  }
  startAsync(data) {
    return Promise.resolve(this.start(data));
  }
  toggle(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings.get(key).mapRight((recording) => recording.toggle());
  }
  toggleAsync(key) {
    return Promise.resolve(this.toggle(key));
  }
  stop(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings
      .take(key)
      .bind((recording) => recording.terminate(this.versioning));
  }
  stopAsync(key) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    return this.recordings
      .take(key)
      .bindAsync((recording) => recording.terminateAsync(this.versioning));
  }
  record({ origin: key, event }) {
    assert(this.session !== null, 'non-initialized appmap %o', this);
    assert(!this.terminated, 'terminated appmap %o', this);
    if (key === null) {
      for (const recording of this.recordings.values()) {
        recording.record(null, event);
      }
      return new Right(null);
    }
    return this.origins.get(key).mapRight((origin) => {
      for (const recording of this.recordings.values()) {
        recording.record(origin, event);
      }
      return null;
    });
  }
  recordAsync(data) {
    return Promise.resolve(this.record(data));
  }
}
