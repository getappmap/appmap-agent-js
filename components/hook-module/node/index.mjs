import Native from "./native.mjs";
import Common from "./common.mjs";

export default (dependencies) => {
  const {
    hook: hookNativeModule,
    unhook: unhookNativeModule,
    transformSourceDefault,
  } = Native(dependencies);
  const { hook: hookCommonModule, unhook: unhookCommonModule } =
    Common(dependencies);
  return {
    transformSourceDefault,
    hook: (agent, configuration, box) => ({
      common: hookCommonModule(agent, configuration),
      native: hookNativeModule(agent, configuration, box),
    }),
    unhook: ({ common, native }) => {
      unhookCommonModule(common);
      unhookNativeModule(native);
    },
  };
};
