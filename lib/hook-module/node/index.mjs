import Native from "./native.mjs";
import Common from "./common.mjs";

export default (dependencies) => {
  const { hookNativeModule, unhookNativeModule, transformSourceDefault } =
    Native(dependencies);
  const { hookCommonModule, unhookCommonModule } = Common(dependencies);
  return {
    transformSourceDefault,
    hookModule: (client, frontend, configuration, box) => ({
      common: hookCommonModule(client, frontend, configuration),
      native: hookNativeModule(client, frontend, configuration, box),
    }),
    unhookModule: ({ common, native }) => {
      unhookCommonModule(common);
      unhookNativeModule(native);
    },
  };
};
