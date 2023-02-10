import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { compileTrace } from "./index.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    recorder: "process",
    appmap_dir: "dirname",
    appmap_file: "basename",
  },
  "protocol://host/base/",
);

assertDeepEqual(compileTrace(configuration, [], { type: "unknown" }), {
  url: "protocol://host/base/dirname/process/basename.appmap.json",
  content: {
    messages: [],
    configuration,
    termination: { type: "unknown" },
  },
});
