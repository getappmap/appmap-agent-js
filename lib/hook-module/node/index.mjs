import Native from "./native.mjs";
import Common from "./common.mjs";

export default (dependencies) => {
  const { hookNativeModuleAsync, transformSourceDefault } =
    Native(dependencies);
  const { hookCommonModuleAsync } = Common(dependencies);
  return {
    transformSourceDefault,
    hookModuleAsync: (promise, client, frontend, configuration, box) =>
      Promise.all([
        hookNativeModuleAsync(promise, client, frontend, configuration, box),
        hookCommonModuleAsync(promise, client, frontend, configuration),
      ]),
  };
};
