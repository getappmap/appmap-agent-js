
import {getDefaultConfig} from './config.mjs';
import Appmap from './appmap.mjs';

const RECORDER_NAME = "node-inline";

export default (env) => {
  const appmap = new Appmap();
  return {
    initialize: (init) => {
      appmap.initialize(RECORDER_NAME, getDefaultConfig(), init);
    },
    terminate: (reason) => {
      appmap.terminate(reason);
    },
    instrumentScript: (path, content) => appmap.instrument("script", path, content),
    instrumentModule: (path, content, {resolve, reject}) => {
      try {
        resolve(appmap.instrument("module", path, content));
      } catch (error) {
        reject(error);
      }
    },
    emit: (event) => {
      appmap.emit(event);
    },
  };
};
