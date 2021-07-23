import { buildAsync } from "../../../build/index.mjs";
import Log from "./log.mjs";

const mainAsync = async () => {
  const { logInfo, logError } = Log(
    await buildAsync({
      globals: {LOG_LEVEL: "WARN"},
      violation: "error",
    }),
  );
  logInfo("foo");
  logError("bar");
};

mainAsync();
