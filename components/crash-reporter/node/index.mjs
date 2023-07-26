import { request } from "node:https";
import { parseExceptionStack } from "../../error/index.mjs";

const {
  Boolean,
  Buffer,
  Date,
  JSON: { stringify: stringifyJSON },
  process: {
    env: { APPMAP_TELEMETRY_DISABLED },
  },
  Promise,
} = globalThis;

// This key is meant to be publically shared. However, I'm adding a simple
// obfuscation to mitigate key scraping bots on GitHub. The key is split on
// hypens and base64 encoded without padding.
// key.split('-').map((x) => x.toString('base64').replace(/=*/, ''))
const INSTRUMENTATION_KEY = [
  "NTBjMWE1YzI",
  "NDliNA",
  "NDkxMw",
  "YjdjYw",
  "ODZhNzhkNDA3NDVm",
]
  .map((x) => Buffer.from(x, "base64").toString("utf8"))
  .join("-");

const INGESTION_ENDPOINT = "centralus-2.in.applicationinsights.azure.com";

/* c8 ignore start */
export const reportException = (exception) => {
  if (APPMAP_TELEMETRY_DISABLED) {
    return null;
  }

  const data = {
    name: "Microsoft.ApplicationInsights.Exception",
    time: new Date().toISOString(),
    iKey: INSTRUMENTATION_KEY,
    tags: {
      "ai.cloud.roleInstance": "@appland/appmap-agent-js",
    },
    data: {
      baseType: "ExceptionData",
      baseData: {
        ver: 2,
        handledAt: "UserCode",
        exceptions: [
          {
            id: 1,
            typeName: exception.name,
            message: exception.message,
            hasFullStack: Boolean(exception.stack),
            parsedStack: parseExceptionStack(exception),
          },
        ],
      },
    },
  };

  const options = {
    hostname: INGESTION_ENDPOINT,
    path: "/v2/track",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve) => {
    const req = request(options, resolve);

    // Don't throw if the request fails - we don't want to crash the app
    req.on("error", resolve);

    req.write(stringifyJSON(data));
    req.end();
  });
};
/* c8 ignore stop */
