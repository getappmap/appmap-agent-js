import {logger} from './logger.mjs';
import { Right } from "./either.mjs";
import { EitherMap } from "./either-map.mjs";
import { Appmap } from './appmap/index.mjs';
import { validateRequest } from './validate.mjs';

const getLast = (array) => array[array.length - 1];

const right = new Right(null);

const dummy = {
  appmap: {
    initialize: (session) => /* assert(session === null) */ right,
    initializeAsync: (session) => /* assert(session === null) */ Promise.resolve(right)
  },
  action: "initialize",
  data: null
};

const execute = ({appmap, action, data}) => appmap[action](data);

const executeAsync = ({appmap, action, data}) => appmap[`${action}Async`](data);

export const makeDispatching = (configuration) => {
  const appmaps = new EitherMap();
  const paths = new Map();
  const versioning = (path) => {
    if (paths.has(path)) {
      const counter = paths.get(path) + 1;
      paths.set(path, counter);
      return `${path}-${counter.toString(10)}`;
    }
    paths.set(path, 0);
    return path;
  };
  const register = (configuration) => configuration.isEnabled().mapRight((enabled) => {
    if (enabled) {
      const appmap = new Appmap(configuration, versioning);
      const key = appmaps.push(appmap);
      return {
        appmap,
        action: "initialize",
        data: `${configuration.getEscapePrefix()}_${key}`
      };
    }
    return dummy;
  });
  const prepare = (request) => {
    logger.info("request %s on %j", request.action, request.session);
    if (request.action === 'initialize') {
      return configuration.extendWithData(
        request.data.data,
        request.data.path,
      ).bind(register);
    }
    return appmaps[request.action === "terminate" ? "take" : "get"](getLast(request.session.split("_"))).mapRight((appmap) => ({
      appmap,
      action: request.action,
      data: request.data
    }));
  };
  return {
    dispatch: (request) => validateRequest(request).bind(prepare).bind(execute),
    dispatchAsync: (request) => validateRequest(request).bind(prepare).bindAsync(executeAsync)
  };
};
