
const global_Reflect_apply = Reflect.apply;
const global_String_prototype_split = String.prototype.split;
const global_Error = Error;
const global_JSON_parse = JSON.parse;
const global_JSON_stringify = JSON.stringify;

module.exports = (version, host, port) => {
  const cache = {__proto__:null};
  const args = [
    `--${version}`,
    "--request", "PUT",
    "--data", "@-",
    "--header", "content-type: application/json; charset=utf-8",
    `http://${host}:${port}`
  ];
  return (data) => {
    const result = ChildProcess.spawnSync("curl", args, {
      input: global_JSON_stringify(data),
      encoding: "utf8",
    });
    if (result.error !== null) {
      throw result.error;
    }
    if (result.signal !== null) {
      throw new global_Error(`Unexpected kill signal: ${result.signal}`);
    }
    if (result.status !== 0) {
      throw new global_Error(`curl request failed with ${result.status} >> ${result.stderr}`);
    }
    if (!global_Reflect_apply(global_String_prototype_startsWith, result.stdout, ["HTTP/2 200 "])) {
      const index = global_Reflect_apply(global_String_prototype_indexOf, result.stdout, ["\r\n"]);
      if (index === -1) {
        throw new global_Error("Cannot extract status line from curl http/2 response");
      }
      throw new global_Error(global_Reflect_apply(global_String_prototype_substring, result.stdout, [0, index]));
    }
    const index = global_Reflect_apply(global_String_prototype_indexOf, result.stdout, ["\r\n\r\n"]);
    if (index === -1) {
      throw new global_Error("Cannot extract body from curl http/2 response");
    }
    return global_JSON_parse(global_Reflect_apply(global_String_prototype_substring, result.stdout, [index + 4]));
  };
};
