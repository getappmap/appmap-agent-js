import { assertNotEqual } from "../../__fixture__.mjs";
import { createBackend } from "../../backend/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  openReceptorAsync,
  getReceptorTracePort,
  getReceptorTrackPort,
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

assertNotEqual(getReceptorTracePort(receptor), 0);

assertNotEqual(getReceptorTrackPort(receptor), 0);

await closeReceptorAsync(receptor);
