import util$default from "./../components/util/default/index.mjs";
import violation$exit from "./../components/violation/exit/index.mjs";
import expect_inner$default from "./../components/expect-inner/default/index.mjs";
import expect$default from "./../components/expect/default/index.mjs";
import log_inner$write_sync from "./../components/log-inner/write-sync/index.mjs";
import log$debug from "./../components/log/debug/index.mjs";
import log$error from "./../components/log/error/index.mjs";
import log$info from "./../components/log/info/index.mjs";
import log$off from "./../components/log/off/index.mjs";
import log$warning from "./../components/log/warning/index.mjs";
import spawn$node from "./../components/spawn/node/index.mjs";
import validate$ajv from "./../components/validate/ajv/index.mjs";
import specifier$default from "./../components/specifier/default/index.mjs";
import repository$node from "./../components/repository/node/index.mjs";
import child$default from "./../components/child/default/index.mjs";
import configuration$default from "./../components/configuration/default/index.mjs";
import storage$file from "./../components/storage/file/index.mjs";
import naming$default from "./../components/naming/default/index.mjs";
import trace$appmap from "./../components/trace/appmap/index.mjs";
import backend$default from "./../components/backend/default/index.mjs";
import server$stub from "./../components/server/stub/index.mjs";
import server$tcp from "./../components/server/tcp/index.mjs";
import batch$default from "./../components/batch/default/index.mjs";

export default (blueprint) => {
  const dependencies = { __proto__: null };
  dependencies["util"] = util$default(dependencies);
  dependencies["violation"] = violation$exit(dependencies);
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["log-inner"] = log_inner$write_sync(dependencies);
  if (!("log" in blueprint)) {
    throw new Error("missing instance for component log");
  }
  dependencies["log"] =
    blueprint["log"] === "warning"
      ? log$warning(dependencies)
      : blueprint["log"] === "off"
      ? log$off(dependencies)
      : blueprint["log"] === "info"
      ? log$info(dependencies)
      : blueprint["log"] === "error"
      ? log$error(dependencies)
      : blueprint["log"] === "debug"
      ? log$debug(dependencies)
      : (() => {
          throw new Error("invalid instance for component log");
        })();
  dependencies["spawn"] = spawn$node(dependencies);
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["repository"] = repository$node(dependencies);
  dependencies["child"] = child$default(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  dependencies["storage"] = storage$file(dependencies);
  dependencies["naming"] = naming$default(dependencies);
  dependencies["trace"] = trace$appmap(dependencies);
  dependencies["backend"] = backend$default(dependencies);
  if (!("server" in blueprint)) {
    throw new Error("missing instance for component server");
  }
  dependencies["server"] =
    blueprint["server"] === "tcp"
      ? server$tcp(dependencies)
      : blueprint["server"] === "stub"
      ? server$stub(dependencies)
      : (() => {
          throw new Error("invalid instance for component server");
        })();
  dependencies["batch"] = batch$default(dependencies);
  return dependencies["batch"];
};
