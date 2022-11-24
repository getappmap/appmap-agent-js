import { getUuid } from "../../uuid/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { makeLog } from "./index-isolate.mjs";

makeLog({}).logInfo("stdout");
makeLog({ APPMAP_LOG_FILE: "2" }).logInfo("stderr");
makeLog({ APPMAP_LOG_FILE: toAbsoluteUrl(getUuid(), getTmpUrl()) }).logInfo(
  "tmp",
);
