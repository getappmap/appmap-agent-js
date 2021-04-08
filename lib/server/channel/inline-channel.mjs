import { getDefaultConfig } from './config.mjs';
import Appmap from './appmap.mjs';

const RECORDER_NAME = 'node-inline';

export default (env) => {
  const handle = makeHandler(getDefaultConfig());
  return {
    requestSync: handle,
    requestAsync: (data, pendings) => {
      if (pendings === null) {
        handle(data);
      } else {
        pendings.resolve(handle(data));
      }
    }
  };
};

  const appmap = new Appmap();
  return {
    requestSync: (name, data) => {
      if (name === "instrument-script") {
        return appmap.instrument('script', path, content);
      }
      logger.error("Unexpected synchronous request: %s", name);
    },
    requestAsync: (name, data, pendings) => {
      if (name === "initialize") {
        appmap.initialize(RECORDER_NAME, getDefaultConfig(), init);
        if (pendings !== null) {
          pendings.resolve(null);
        }
      }
      logger.error("Unexpected asynchronous request: %s", name);

    }
  }
  return {
    initialize: (init) => {
      appmap.initialize(RECORDER_NAME, getDefaultConfig(), init);
    },
    terminate: (reason) => {
      appmap.terminate(reason);
    },
    instrumentScript: (path, content) =>
      appmap.instrument('script', path, content),
    instrumentModule: (path, content, { resolve, reject }) => {
      try {
        resolve(appmap.instrument('module', path, content));
      } catch (error) {
        reject(error);
      }
    },
    emit: (event) => {
      appmap.emit(event);
    },
  };
};
