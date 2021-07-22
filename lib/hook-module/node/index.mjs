import NativeModule from "./esm.mjs";
import CommonModule from "./cjs.mjs";

export default ({dependencies}) => {
  const {hookNativeModuleAsync} = NativeModule(dependencies);
  const {hookCommonModuleAsync} = CommonModule(dependencies);
  return {
    hookModuleAsync: (args, box) => Promise.all([
      hookNativeModuleAsync(args, box),
      hookCommonModuleAsync(args),
    ]),
  };
};
