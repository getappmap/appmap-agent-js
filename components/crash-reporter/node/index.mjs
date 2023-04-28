import { request } from "node:https";
import { join, mkdirSync } from "node:path";
import { tmpdir, release, platform } from "node:os";
import { writeFileSync } from "node:fs";
import { readFile, readdir, unlink } from "node:fs/promises";

import { logWarning } from "../../log/index.mjs";

const {
  Boolean,
  Buffer,
  Date,
  Error,
  JSON: { stringify: stringifyJSON },
  Number,
  process: {
    env: { APPMAP_TELEMETRY_DISABLED },
    version: nodeVersion,
  },
  Promise,
  Set,
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

const METHOD_REGEX = /at\s(?!\w+:\/\/)(.*?)[\s:]/u;
const INGESTION_ENDPOINT = "centralus-2.in.applicationinsights.azure.com";
const LOCATION_REGEX = /at\s+(\w+:\/\/|.*\()?(?:\w+:\/\/)?(.*):(\d+):\d+/u;
const CRASH_LOG_DIRECTORY = join(tmpdir(), "appmap-agent-js", "crash-reports");

let EXCEPTION_QUEUE = [];

class CrashReporterException extends Error {}

const parseExceptionStack = (exception) =>
  exception.stack
    ?.split("\n")
    .filter((line) => line.match(/^\s+at\s/u))
    .map((line, index) => {
      const method = line.match(METHOD_REGEX)?.[1] ?? "";
      const [, , fileName, lineNumber] = line.match(LOCATION_REGEX) ?? [];
      if (!fileName || !lineNumber) {
        return null;
      }

      return {
        level: index,
        method,
        fileName,
        line: Number(lineNumber),
      };
    })
    .filter(Boolean) ?? [];

// This method must remain synchronous to ensure that the process does not
// exit before the exception is recorded.
export const persistExceptionQueue = () => {
  try {
    mkdirSync(CRASH_LOG_DIRECTORY, { recursive: true });
    for (const exception of EXCEPTION_QUEUE) {
      const fileName = join(CRASH_LOG_DIRECTORY, `${exception.time}.json`);
      const data = stringifyJSON(exception);
      writeFileSync(fileName, data);
    }
  } catch (error) {
    // For now, we'll do nothing.
    // We're likely already in an error state or shutting down, so we
    // don't much ability to recover the data.
    logWarning("Failed to persist exception queue: %O", error);
  }
};

const buildExceptionData = (exception) => ({
  name: "Microsoft.ApplicationInsights.Exception",
  time: new Date().toISOString(),
  iKey: INSTRUMENTATION_KEY,
  tags: {
    "ai.application.applicationId": "@appland/appmap-agent-js",
    "ai.cloud.roleInstance": "@appland/appmap-agent-js",
    "ai.device.os": platform(),
    "ai.device.osVersion": release(),
    "ai.internal.sdkVersion": nodeVersion,
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
});

// This method must remain synchronous to ensure that the process does not
// exit before the exception is recorded.
export const recordException = (exception) => {
  const exceptionData = buildExceptionData(exception);
  EXCEPTION_QUEUE.push(exceptionData);
};

const emitExceptionData = (exceptionData) => {
  if (APPMAP_TELEMETRY_DISABLED) {
    return null;
  }

  let payload = exceptionData;
  if (typeof exceptionData === "object") {
    payload = stringifyJSON(exceptionData);
  }

  const options = {
    hostname: INGESTION_ENDPOINT,
    path: "/v2/track",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      res.on("data", () => {});
      res.on("error", reject);
      res.on("end", resolve);
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
};

export const flushExceptionQueue = async () => {
  const exceptionsToProcess = [...EXCEPTION_QUEUE];
  const processedExceptions = new Set();
  for (const exception of exceptionsToProcess) {
    try {
      await emitExceptionData(exception);
      processedExceptions.add(exception);
    } catch {
      // Do nothing for now. We'll try again next time.
    }
  }
  EXCEPTION_QUEUE = EXCEPTION_QUEUE.filter(
    (exception) => !processedExceptions.has(exception),
  );
};

export const loadExceptionQueue = async () => {
  let files = [];
  try {
    files = await readdir(CRASH_LOG_DIRECTORY, { withFileTypes: true });
  } catch (error) {
    recordException(new CrashReporterException(error));
    flushExceptionQueue();
    return;
  }

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".json")) {
      continue;
    }

    const fileName = join(CRASH_LOG_DIRECTORY, file.name);
    try {
      const data = await readFile(fileName);

      // Delete the file before emitting it. Err on the side of losing data
      // rather than emitting the same data multiple times. Simply put, if
      // the file cannot be deleted, we'll try again next time.
      await unlink(fileName);
      await emitExceptionData(data);
    } catch (error) {
      recordException(new CrashReporterException(error));
    }
  }
};
