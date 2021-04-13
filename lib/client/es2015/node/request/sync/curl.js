const ChildProcess = require("child_process");

const global_Reflect_apply = Reflect.apply;
const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;
const global_String_prototype_startsWith = String.prototype.startsWith;
const global_String_prototype_indexOf = String.prototype.indexOf;
const global_String_prototype_substring = String.prototype.substring;

module.exports = (version, host, port) => {
  const args = [
    `--${version}`,
    "--request",
    "PUT",
    "--data",
    "@-",
    "--header",
    "content-type: application/json; charset=utf-8",
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
    if (result.error !== null) {
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
    if (
      !global_Reflect_apply(global_String_prototype_startsWith, result.stdout, [
        "HTTP/2 200 ",
      ])
    ) {
      const index = global_Reflect_apply(
        global_String_prototype_indexOf,
        result.stdout,
        ["\r\n"]
      );
      if (index === -1) {
        throw new global_Error(
          "Cannot extract status line from curl http/2 response"
        );
      }
      throw new global_Error(
        global_Reflect_apply(global_String_prototype_substring, result.stdout, [
          0,
          index,
        ])
      );
    }
    const index = global_Reflect_apply(
      global_String_prototype_indexOf,
      result.stdout,
      ["\r\n\r\n"]
    );
    if (index === -1) {
      throw new global_Error("Cannot extract body from curl http/2 response");
    }
    return global_JSON_parse(
      global_Reflect_apply(global_String_prototype_substring, result.stdout, [
        index + 4,
      ])
    );
  };
};
