import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import { createMirrorSourceMap } from "../../source/index.mjs?env=test";
import { validateMessage } from "../../validate/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
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
} from "./index.mjs?env=test";

const configuration = extendConfiguration(
  createConfiguration("file:///w:/home"),
  {
    packages: [
      {
        regexp: "^",
      },
    ],
  },
  "file:///w:/base",
);

const frontend = createFrontend(configuration);

assertEqual(typeof getSerializationEmptyValue(frontend), "symbol");

assertEqual(typeof getFreshTab(frontend), "number");

validateMessage(formatGroup(frontend, 123, 456, "description"));

validateMessage(formatStartTrack(frontend, "track", {}, null));

validateMessage(formatStopTrack(frontend, "track", 0));

validateMessage(formatError(frontend, "name", "message", "stack"));

validateMessage(
  formatBeginEvent(frontend, 123, 456, 789, getBundlePayload(frontend)),
);

validateMessage(formatBeginAmend(frontend, 123, getBundlePayload(frontend)));

{
  const file = {
    url: "file:///w:/filename.js",
    content: "123;",
    type: "script",
  };
  assertDeepEqual(instrument(frontend, file, createMirrorSourceMap(file)), {
    url: "file:///w:/filename.js",
    content: "123;\n",
    messages: [
      {
        type: "source",
        url: "file:///w:/filename.js",
        content: "123;",
        exclude: createConfiguration("file:///w:/home").exclude,
        shallow: false,
        inline: false,
      },
    ],
  });
}
