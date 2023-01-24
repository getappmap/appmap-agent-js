import { assertDeepEqual } from "../../__fixture__.mjs";
import { compileTrace } from "./index.mjs";

assertDeepEqual(
  compileTrace(
    {
      recorder: "process",
      appmap_dir: "protocol://host/dirname/",
      appmap_file: "basename",
    },
    [],
  ),
  {
    url: "protocol://host/dirname/process/basename.appmap.json",
    content: [],
  },
);
