import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { validateMessage } from "../../validate/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createFrontend,
  getSession,
  formatStartTrack,
  formatStopTrack,
  formatError,
  getSerializationEmptyValue,
  extractMissingUrlArray,
  instrument,
  getFreshTab,
  getBundlePayload,
  formatGroup,
  formatBeginEvent,
  formatBeginAmend,
} from "./index.mjs";

const { Map, Error } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    session: "session",
    packages: [
      {
        regexp: "^",
      },
    ],
  },
  "protocol://host/base",
);

const frontend = createFrontend(configuration);

assertEqual(getSession(frontend), "session");

assertEqual(typeof getSerializationEmptyValue(frontend), "symbol");

assertEqual(typeof getFreshTab(frontend), "number");

validateMessage(formatGroup(frontend, 123, 456, "description"));

validateMessage(formatStartTrack(frontend, "track", configuration));

validateMessage(formatStopTrack(frontend, "track", { type: "manual" }));

validateMessage(formatError(frontend, new Error("BOUM")));

validateMessage(
  formatBeginEvent(frontend, 123, 456, 789, getBundlePayload(frontend)),
);

validateMessage(formatBeginAmend(frontend, 123, getBundlePayload(frontend)));

assertDeepEqual(
  extractMissingUrlArray(frontend, "protocol://host/filename.js", new Map()),
  ["protocol://host/filename.js"],
);

assertDeepEqual(
  instrument(
    frontend,
    "protocol://host/filename.js",
    new Map([["protocol://host/filename.js", "123;"]]),
  ),
  {
    url: "protocol://host/filename.js",
    content: "123;\n",
    messages: [
      {
        type: "source",
        url: "protocol://host/filename.js",
        content: "123;",
      },
    ],
  },
);
