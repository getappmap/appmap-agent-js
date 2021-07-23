import { buildAsync } from "../../build/index.mjs";
import { generateLog } from "./log.mjs";

const mainAsync = async () => {
  const { logInfo, logError } = generateLog("WARNING")(
    await buildAsync({
      violation: "error",
      assert: "debug",
      util: "default",
    }),
  );
  logInfo("foo");
  logError("bar");
};

mainAsync();
