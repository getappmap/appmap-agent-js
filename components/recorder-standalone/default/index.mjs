import { readGlobal } from "../../global/index.mjs";
import { recordAsync } from "../../recorder-cli/index.mjs";
// Do not use top-level await to make this a script after bundling.
// This should only be used with browser recorder-cli and it resolve
// directly.
// In the future, we probably want to make `recorder-cli` standalone
// anyway.
recordAsync(readGlobal("__APPMAP_CONFIGURATION__"));
