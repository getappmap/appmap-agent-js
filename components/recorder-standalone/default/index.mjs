import { readGlobal } from "../../global/index.mjs";
import { record } from "../../recorder-cli/index.mjs";
record(readGlobal("__APPMAP_CONFIGURATION__"));
