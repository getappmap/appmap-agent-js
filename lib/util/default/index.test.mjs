import { buildAsync } from "../../../build/index.mjs";
import Util from "./index.mjs";

const testAsync = async () => {
  Util(await buildAsync({ violation: "error", assert: "debug" }));
};

testAsync();
