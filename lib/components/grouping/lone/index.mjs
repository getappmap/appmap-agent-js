
import {executionAsyncId, createHook} from "async_hooks";

export default (dependencies) => {
  const {util:{constant, noop}} = dependencies;
  return {
    initializeGrouping: noop,
    getCurrentGroup: constant(0),
    terminateGrouping: noop,
  };
};
