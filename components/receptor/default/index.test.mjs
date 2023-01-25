import { assertNotEqual } from "../../__fixture__.mjs";
import { createBackend } from "../../backend/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  openReceptorAsync,
  adaptReceptorConfiguration,
  closeReceptorAsync,
} from "./index.mjs";

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home/"),
  {
    "trace-port": 0,
    "track-port": 0,
  },
  "protocol://host/base/",
);

const backend = createBackend(configuration);

const receptor = await openReceptorAsync(configuration, backend);

assertNotEqual(
  adaptReceptorConfiguration(receptor, configuration)["trace-port"],
  0,
);

await closeReceptorAsync(receptor);
