
import {cpus} from "os";

export default (dependencies) => {
  return {
    getCPUCount: () => cpus().length;
  };
};
