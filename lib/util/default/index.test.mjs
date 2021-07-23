import { buildAsync } from "../../../build/index.mjs";
import Util from "./index.mjs";

const mainAsync = async () => {
  Util(await buildAsync({ violation: "error", assert: "debug" }));
};

mainAsync();
