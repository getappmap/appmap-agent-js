const ChildProcess = require("child_process");

const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;
const global_Reflect_apply = Reflect.apply;
const global_String_prototype_substring = String.prototype.substring;

const getArg = {
  __proto__: null,
  1: "--http1.1",
  2: "--http2-prior-knowledge",
  3: "--http3",
};

exports.makeRequest = (version, host, port) => {
  const args = [
    getArg[version],
    "--request",
    "PUT",
    "--data",
    "@-", // 7.55.0
    "--header",
    "content-type: application/json; charset=utf-8",
    "--write-out",
    // Better option: "%{stderr}%{http_code}"
    // But Travis fails because old curl version
    // https://curl.se/docs/manpage.html#-w
    // Require curl >= 7.63.0
    "%{http_code}",
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
    const body = global_Reflect_apply(
      global_String_prototype_substring,
      [result.stdout],
      [0, result.stdout.length - 3]
    );
    const status = global_Reflect_apply(
      global_String_prototype_substring,
      [result.stdout],
      [result.stdout.length - 3, 1 / 0]
    );
    if (status !== "200") {
      throw new global_Error(`http status ${status} >> ${body}`);
    }
    return global_JSON_parse(body);
  };
};
