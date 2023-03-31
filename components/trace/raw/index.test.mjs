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

assertDeepEqual(
  compileTrace(
    configuration,
    [
      {
        url: "protocol://host/base/script.js",
        content: "123;",
        hash: "hash",
      },
    ],
    [],
    { type: "unknown" },
  ),
  {
    url: "protocol://host/base/dirname/process/basename.appmap.json",
    content: {
      configuration,
      messages: [
        {
          type: "source",
          url: "protocol://host/base/script.js",
          content: "123;",
        },
      ],
      termination: { type: "unknown" },
    },
  },
);
