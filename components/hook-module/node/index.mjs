import Native from "./native.mjs";
import Common from "./common.mjs";

export default (dependencies) => {
  const { hookNativeModule, unhookNativeModule, transformSourceDefault } =
    Native(dependencies);
  const { hookCommonModule, unhookCommonModule } = Common(dependencies);
  return {
    transformSourceDefault,
    hookModule: (emitter, frontend, configuration, box) => ({
      common: hookCommonModule(emitter, frontend, configuration),
      native: hookNativeModule(emitter, frontend, configuration, box),
    }),
    unhookModule: ({ common, native }) => {
      unhookCommonModule(common);
      unhookNativeModule(native);
    },
  };
};
