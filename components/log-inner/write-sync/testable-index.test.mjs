import { getUuid } from "../../uuid/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";

import makeLog from "./testable-index.mjs";

makeLog({}).logInfo("stdout");
makeLog({ "log-file": 2 }).logInfo("stderr");
makeLog({ "log-file": toAbsoluteUrl(getUuid(), getTmpUrl()) }).logInfo("tmp");
