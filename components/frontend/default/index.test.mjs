import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createMirrorMapping } from "../../mapping/index.mjs";
import { validateMessage } from "../../validate/index.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import {
  createFrontend,
  formatStartTrack,
  formatStopTrack,
  formatError,
  getSerializationEmptyValue,
  instrument,
  getFreshTab,
  getBundlePayload,
  formatGroup,
  formatBeginEvent,
  formatBeginAmend,
} from "./index.mjs";

const { Error } = globalThis;

const configuration = extendConfiguration(
  createConfiguration("protocol://host/home"),
  {
    packages: [
      {
        regexp: "^",
      },
    ],
  },
  "protocol://host/base",
);

const frontend = createFrontend(configuration);

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

{
  const file = {
    url: "protocol://host/filename.js",
    content: "123;",
    type: "script",
  };
  assertDeepEqual(instrument(frontend, file, createMirrorMapping(file)), {
    url: "protocol://host/filename.js",
    content: "123;\n",
    messages: [
      {
        type: "source",
        url: "protocol://host/filename.js",
        content: "123;",
      },
    ],
  });
}
