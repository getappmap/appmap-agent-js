import "../../__fixture__.mjs";
import { createConfiguration } from "../../configuration/index.mjs?env=test";
import { createSerialization } from "../../serialization/index.mjs?env=test";
import { validatePayload } from "../../validate/index.mjs?env=test";
import {
  getBundlePayload,
  getJumpPayload,
  formatApplyPayload,
  formatReturnPayload,
  formatThrowPayload,
  formatAwaitPayload,
  formatResolvePayload,
  formatRejectPayload,
  formatYieldPayload,
  getResumePayload,
  formatQueryPayload,
  getAnswerPayload,
  formatRequestPayload,
  formatResponsePayload,
  formatGroupPayload,
  formatUngroupPayload,
} from "./payload.mjs?env=test";

const configuration = createConfiguration("file:///home");

const serialization = createSerialization(configuration);

validatePayload(getBundlePayload({ serialization }));

validatePayload(getJumpPayload({ serialization }));

validatePayload(getResumePayload({ serialization }));

validatePayload(getAnswerPayload({ serialization }));

// apply //

validatePayload(
  formatApplyPayload({ serialization }, "function", "this", ["argument"]),
);

validatePayload(formatReturnPayload({ serialization }, "function", "result"));

validatePayload(formatThrowPayload({ serialization }, "function", "error"));

validatePayload(formatAwaitPayload({ serialization }, "promise"));

validatePayload(formatResolvePayload({ serialization }, "result"));

validatePayload(formatRejectPayload({ serialization }, "error"));

validatePayload(formatYieldPayload({ serialization }, "iterator"));

// query //

validatePayload(
  formatQueryPayload({ serialization }, "database", "version", "sql", [
    "parameter",
  ]),
);

validatePayload(
  formatQueryPayload({ serialization }, "database", "version", "sql", {
    name: "parameter",
  }),
);

// http //

validatePayload(
  formatRequestPayload(
    { serialization },
    "client",
    "HTTP/1.1",
    "GET",
    "/path",
    null,
    { header: "value" },
    "body",
  ),
);

validatePayload(
  formatResponsePayload(
    { serialization },
    "client",
    200,
    "OK",
    { header: "value" },
    "body",
  ),
);

// group //

validatePayload(formatGroupPayload({ serialization }, 123, "description"));

validatePayload(formatUngroupPayload({ serialization }, 123));
