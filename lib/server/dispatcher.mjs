import * as Path from 'path';
import logger from './logger.mjs';
import { PushMap } from "./push-map.mjs";
import { Appmap } from './appmap.mjs';
import { validateRequest } from './validate.mjs';

const getLast = (array) => array[array.length - 1];

const identity = (any) => any;

const dummy = {
  appmap: {
    initialize: identity,
    initializeAsync: Promise.resolve
  },
  action: "initialize",
  data: null
};

const execute = ({appmap, action, data}) => appmap[action](data);

const executeAsync = ({appmap, action, data}) => appmap[`${action}Async`](data);

const makeDispatching = (configuration) => {
  const appmaps = new PushMap();
  const paths = new Map();
  const versioning = (key) => {
    if (paths.has(path)) {
      const counter = paths.get(path) + 1;
      paths.set(path, counter);
      return `${path}-${counter.toString(10)}`;
    }
    paths.set(path, 0);
    return path;
  };
  const register = (configuration) => {
    if (configuration.isEnabled()) {
      const appmap = new Appmap(configuration, versioning);
      const key = appmaps.push(appmap);
      return {
        appmap: appmaps.get(key),
        action: "initialize",
        data: `${configuration.getEscapePrefix()}_${key}`
      };
    }
    return dummy;
  };
  const prepare = (request) => {
    if (request.action === 'initialize') {
      if (!Path.isAbsolute(request.process.argv[1])) {
        return new Left("expected absolute path for main file, got: %j", request.process.argv[1]);
      }
      return configuration.extendWithData(
        {
          main: request.process.argv[1],
          ... request.data,
        },
        request.configuration.path,
      ).mapRight(register));
    }
    const key = getLast(request.session.split("_"));
    if (!appmaps.has(key)) {
      return new Left("missing appmap %o", key);
    }
    const appmap = appmaps.get(key);
    if (request.action === 'terminate') {
      appmaps.delete(key);
    }
    return new Right({appmap, action:request.action, data:request.data});
  };
  return {
    dispatch: (request) => validateRequest(request).mapRight(prepare).bind(execute),
    dispatchAsync: (request) => validateRequest(request).mapRight(prepare).bindAsync(executeAsync)
  };
};
