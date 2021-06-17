const ChildProcess = require("child_process");
const { assert, expect } = require("../../check.js");
const { expectVersion } = require("../../version.js");

const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;
const global_Reflect_apply = Reflect.apply;
const global_String_prototype_substring = String.prototype.substring;
const global_String_prototype_split = String.prototype.split;
const global_Reflect_getOwnPropertyDescriptor =
  Reflect.getOwnPropertyDescriptor;
const global_undefined = undefined;

{
  const child = ChildProcess.spawnSync("curl", ["--version"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  expect(
    global_Reflect_getOwnPropertyDescriptor(child, "error") ===
      global_undefined,
    "failed to launch curl version query >> %s",
    child.error
  );
  expect(
    child.signal === null,
    "unexpected kill signal for curl version query: %o",
    child.signal
  );
  expect(
    child.status === 0,
    "unexpected non-zero exit code for curl version query: %o",
    child.status
  );
  const parts = global_Reflect_apply(
    global_String_prototype_split,
    child.stdout,
    [" "]
  );
  expect(
    parts.length >= 2,
    "could not parse curl name/version: %o",
    child.stdout
  );
  expect(parts[0] === "curl", "unexpected curl name: %o", parts[0]);
  expectVersion("curl", parts[1], "7.55");
}

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
  return (json, discarded) => {
    const child = ChildProcess.spawnSync("curl", args, {
      input: global_JSON_stringify(json),
      encoding: "utf8",
    });
    expect(
      global_Reflect_getOwnPropertyDescriptor(child, "error") ===
        global_undefined,
      "curl error >> %s",
      child.error
    );
    expect(child.signal === null, "curl kill signal: %o", child.signal);
    expect(child.status === 0, "curl non-zero exit code: %o", child.status);
    const body = global_Reflect_apply(
      global_String_prototype_substring,
      [child.stdout],
      [0, child.stdout.length - 3]
    );
    const status = global_Reflect_apply(
      global_String_prototype_substring,
      [child.stdout],
      [child.stdout.length - 3, 1 / 0]
    );
    expect(status !== "400", body);
    assert(
      status === "200",
      "unexpected http status code: %o with body: %o",
      status,
      body
    );
    return global_JSON_parse(body);
  };
};
