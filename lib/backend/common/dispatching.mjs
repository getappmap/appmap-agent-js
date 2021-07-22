import { assert } from './assert.mjs';
import { logger } from './logger.mjs';
import { Right, forEither, forEitherAsync } from './either.mjs';
import { EitherMap } from './either-map.mjs';
import { Appmap } from './appmap/index.mjs';
import { validateRequest } from './validate.mjs';

export default (dependencies, options) => new Dispatching(dependencies, options);

const getLast = (array) => array[array.length - 1];

const right = new Right(null);

const dummy = {
  appmap: {
    initialize: (session) => /* assert(session === null) */ right,
    initializeAsync: (session) =>
      /* assert(session === null) */ Promise.resolve(right),
  },
  action: 'initialize',
  data: null,
};

const execute = ({ appmap, action, data }) => appmap[action](data);

const executeAsync = ({ appmap, action, data }) =>
  appmap[`${action}Async`](data);

export class Dispatching {
  constructor(storage, options) {
    this.storage = storage;
    this.appmaps = new EitherMap();
    this.terminated = false;
    this.prepare = (request) => {
      logger.info('request %s on %j', request.action, request.session);
      if (request.action === 'initialize') {
        return configuration
          .extendWithData(request.data)
          .bind((configuration) =>
            configuration.isEnabled().mapRight((enabled) => {
              if (enabled) {
                const appmap = new Appmap(configuration, this.versioning);
                const key = this.appmaps.push(appmap);
                return {
                  appmap,
                  action: 'initialize',
                  data: `${configuration.getEscapePrefix()}_${key}`,
                };
              }
              return dummy;
            }),
          );
      }
      return this.appmaps[request.action === 'terminate' ? 'take' : 'get'](
        getLast(request.session.split('_')),
      ).mapRight((appmap) => ({
        appmap,
        action: request.action,
        data: request.data,
      }));
    };
  }
  dispatch(request) {
    assert(!this.terminated, 'terminated dispatching %o', this);
    return validateRequest(request).bind(this.prepare).bind(execute);
  }
  terminate() {
    assert(!this.terminated, 'terminated dispatching %o', this);
    this.terminated = true;
    return forEither(this.appmaps.values(), (appmap) => appmap.terminate());
  }
  dispatchAsync(request) {
    assert(!this.terminated, 'terminated dispatching %o', this);
    return validateRequest(request).bind(this.prepare).bindAsync(executeAsync);
  }
  terminateAsync() {
    assert(!this.terminated, 'terminated dispatching %o', this);
    this.terminated = true;
    return forEitherAsync(this.appmaps.values(), (appmap) =>
      appmap.terminateAsync(),
    );
  }
}