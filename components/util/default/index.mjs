import Array from "./array.mjs";
import Box from "./box.mjs";
import Counter from "./counter.mjs";
import Function from "./function.mjs";
import Object from "./object.mjs";
import Path from "./path.mjs";
import Version from "./version.mjs";

export default (dependencies) => {
  return {
    ...Array(dependencies),
    ...Box(dependencies),
    ...Counter(dependencies),
    ...Function(dependencies),
    ...Object(dependencies),
    ...Path(dependencies),
    ...Version(dependencies),
  };
};
