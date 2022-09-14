import "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Payload from "./payload.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { createConfiguration } = await buildTestComponentAsync("configuration");
const { createSerialization } = await buildTestComponentAsync("serialization");
const { validatePayload } = await buildTestComponentAsync("validate");

const {
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
} = Payload(dependencies);

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
