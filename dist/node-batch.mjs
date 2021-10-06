import util$default from "./../components/util/default/index.mjs";
import violation$error from "./../components/violation/error/index.mjs";
import violation$exit from "./../components/violation/exit/index.mjs";
import expect_inner$default from "./../components/expect-inner/default/index.mjs";
import expect$default from "./../components/expect/default/index.mjs";
import log_inner$write_sync from "./../components/log-inner/write-sync/index.mjs";
import log$debug from "./../components/log/debug/index.mjs";
import log$error from "./../components/log/error/index.mjs";
import log$info from "./../components/log/info/index.mjs";
import log$off from "./../components/log/off/index.mjs";
import log$warning from "./../components/log/warning/index.mjs";
import validate$ajv from "./../components/validate/ajv/index.mjs";
import specifier$default from "./../components/specifier/default/index.mjs";
import repository$node from "./../components/repository/node/index.mjs";
import child$default from "./../components/child/default/index.mjs";
import engine$node from "./../components/engine/node/index.mjs";
import configuration$default from "./../components/configuration/default/index.mjs";
import validate_message$off from "./../components/validate-message/off/index.mjs";
import validate_message$on from "./../components/validate-message/on/index.mjs";
import validate_appmap$off from "./../components/validate-appmap/off/index.mjs";
import validate_appmap$on from "./../components/validate-appmap/on/index.mjs";
import naming$default from "./../components/naming/default/index.mjs";
import trace$appmap from "./../components/trace/appmap/index.mjs";
import backend$default from "./../components/backend/default/index.mjs";
import spawn$node from "./../components/spawn/node/index.mjs";
import uuid$random from "./../components/uuid/random/index.mjs";
import service$default from "./../components/service/default/index.mjs";
import http$node_http from "./../components/http/node-http/index.mjs";
import receptor$file from "./../components/receptor/file/index.mjs";
import receptor$http from "./../components/receptor/http/index.mjs";
import batch$default from "./../components/batch/default/index.mjs";

export default (blueprint) => {
  const dependencies = {__proto__:null};
  dependencies["util"] = util$default(dependencies);
  if (!("violation" in blueprint)) { throw new Error("missing instance for component violation"); }
  dependencies["violation"] = (blueprint["violation"] === "exit" ? violation$exit(dependencies) : (blueprint["violation"] === "error" ? violation$error(dependencies) : ((() => { throw new Error("invalid instance for component violation"); }) ())));
  dependencies["expect-inner"] = expect_inner$default(dependencies);
  dependencies["expect"] = expect$default(dependencies);
  dependencies["log-inner"] = log_inner$write_sync(dependencies);
  if (!("log" in blueprint)) { throw new Error("missing instance for component log"); }
  dependencies["log"] = (blueprint["log"] === "warning" ? log$warning(dependencies) : (blueprint["log"] === "off" ? log$off(dependencies) : (blueprint["log"] === "info" ? log$info(dependencies) : (blueprint["log"] === "error" ? log$error(dependencies) : (blueprint["log"] === "debug" ? log$debug(dependencies) : ((() => { throw new Error("invalid instance for component log"); }) ()))))));
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["repository"] = repository$node(dependencies);
  dependencies["child"] = child$default(dependencies);
  dependencies["engine"] = engine$node(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  if (!("validate-message" in blueprint)) { throw new Error("missing instance for component validate-message"); }
  dependencies["validate-message"] = (blueprint["validate-message"] === "on" ? validate_message$on(dependencies) : (blueprint["validate-message"] === "off" ? validate_message$off(dependencies) : ((() => { throw new Error("invalid instance for component validate-message"); }) ())));
  if (!("validate-appmap" in blueprint)) { throw new Error("missing instance for component validate-appmap"); }
  dependencies["validate-appmap"] = (blueprint["validate-appmap"] === "on" ? validate_appmap$on(dependencies) : (blueprint["validate-appmap"] === "off" ? validate_appmap$off(dependencies) : ((() => { throw new Error("invalid instance for component validate-appmap"); }) ())));
  dependencies["naming"] = naming$default(dependencies);
  dependencies["trace"] = trace$appmap(dependencies);
  dependencies["backend"] = backend$default(dependencies);
  dependencies["spawn"] = spawn$node(dependencies);
  dependencies["uuid"] = uuid$random(dependencies);
  dependencies["service"] = service$default(dependencies);
  dependencies["http"] = http$node_http(dependencies);
  if (!("receptor" in blueprint)) { throw new Error("missing instance for component receptor"); }
  dependencies["receptor"] = (blueprint["receptor"] === "http" ? receptor$http(dependencies) : (blueprint["receptor"] === "file" ? receptor$file(dependencies) : ((() => { throw new Error("invalid instance for component receptor"); }) ())));
  dependencies["batch"] = batch$default(dependencies);
  return dependencies["batch"];
};