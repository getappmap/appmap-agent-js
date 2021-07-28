import { buildTestAsync } from "../../../build/index.mjs";
import Util from "./index.mjs";

const testAsync = async () => {
  Util(await buildTestAsync(import.meta));
};

testAsync();
