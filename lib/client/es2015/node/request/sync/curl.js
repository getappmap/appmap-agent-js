const ChildProcess = require("child_process");

const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

const getArg = {
  __proto__: null,
  1: "--http1.1",
  2: "--http2-prior-knowledge",
  3: "--http3",
};

module.exports = (version, host, port) => {
  const args = [
    getArg[version],
    "--request",
    "PUT",
    "--data",
    "@-",
    "--header",
    "content-type: application/json; charset=utf-8",
    "--write-out",
    "%{stderr}%{http_code}",
    "--silent",
    "--show-error",
  ];
  if (typeof port === "number") {
    args.push(`http://${host}:${port}`);
  } else {
    args.push("--unix-socket", port);
  }
  return (json) => {
    const result = ChildProcess.spawnSync("curl", args, {
      input: global_JSON_stringify(json),
      encoding: "utf8",
    });
    /* c8 ignore start */
    if (result.error) {
      throw result.error;
    }
    if (result.signal !== null) {
      throw new global_Error(`Unexpected kill signal: ${result.signal}`);
    }
    if (result.status !== 0) {
      throw new global_Error(
        `curl request failed with ${result.status} >> ${result.stderr}`
      );
    }
    /* c8 ignore stop */
    if (result.stderr !== "200") {
      throw new global_Error(
        `http status ${result.stderr} >> ${result.stdout}`
      );
    }
    if (result.stdout === "") {
      return null;
    }
    return global_JSON_parse(result.stdout);
  };
};
