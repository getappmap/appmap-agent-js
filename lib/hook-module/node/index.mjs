import NativeModule from "./esm.mjs";
import CommonModule from "./cjs.mjs";

export default (dependencies) => {
  const { hookNativeModuleAsync } = NativeModule(dependencies);
  const { hookCommonModuleAsync } = CommonModule(dependencies);
  return {
    hookModuleAsync: (client, state, configuration, box) =>
      Promise.all([
        hookNativeModuleAsync(client, state, configuration, box),
        hookCommonModuleAsync(client, state, configuration),
      ]),
  };
};
