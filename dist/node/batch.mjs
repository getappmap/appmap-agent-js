import util$default from "./../../components/util/default/index.mjs";
import violation$exit from "./../../components/violation/exit/index.mjs";
import expect_inner$default from "./../../components/expect-inner/default/index.mjs";
import expect$default from "./../../components/expect/default/index.mjs";
import log_inner$write_sync from "./../../components/log-inner/write-sync/index.mjs";
import log$debug from "./../../components/log/debug/index.mjs";
import log$error from "./../../components/log/error/index.mjs";
import log$info from "./../../components/log/info/index.mjs";
import log$off from "./../../components/log/off/index.mjs";
import log$warning from "./../../components/log/warning/index.mjs";
import validate$ajv from "./../../components/validate/ajv/index.mjs";
import specifier$default from "./../../components/specifier/default/index.mjs";
import engine$node from "./../../components/engine/node/index.mjs";
import repository$node from "./../../components/repository/node/index.mjs";
import configuration$default from "./../../components/configuration/default/index.mjs";
import validate_message$off from "./../../components/validate-message/off/index.mjs";
import validate_message$on from "./../../components/validate-message/on/index.mjs";
import validate_appmap$off from "./../../components/validate-appmap/off/index.mjs";
import validate_appmap$on from "./../../components/validate-appmap/on/index.mjs";
import trace$appmap from "./../../components/trace/appmap/index.mjs";
import backend$default from "./../../components/backend/default/index.mjs";
import spawn$node from "./../../components/spawn/node/index.mjs";
import configuration_helper$default from "./../../components/configuration-helper/default/index.mjs";
import uuid$random from "./../../components/uuid/random/index.mjs";
import service$default from "./../../components/service/default/index.mjs";
import http$node_http from "./../../components/http/node-http/index.mjs";
import receptor_http$http from "./../../components/receptor-http/http/index.mjs";
import receptor_file$file from "./../../components/receptor-file/file/index.mjs";
import receptor$default from "./../../components/receptor/default/index.mjs";
import batch$default from "./../../components/batch/default/index.mjs";

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
  dependencies["validate"] = validate$ajv(dependencies);
  dependencies["specifier"] = specifier$default(dependencies);
  dependencies["engine"] = engine$node(dependencies);
  dependencies["repository"] = repository$node(dependencies);
  dependencies["configuration"] = configuration$default(dependencies);
  if (!("validate-message" in blueprint)) {
    throw new Error("missing instance for component validate-message");
  }
  dependencies["validate-message"] =
    blueprint["validate-message"] === "on"
      ? validate_message$on(dependencies)
      : blueprint["validate-message"] === "off"
      ? validate_message$off(dependencies)
      : (() => {
          throw new Error("invalid instance for component validate-message");
        })();
  if (!("validate-appmap" in blueprint)) {
    throw new Error("missing instance for component validate-appmap");
  }
  dependencies["validate-appmap"] =
    blueprint["validate-appmap"] === "on"
      ? validate_appmap$on(dependencies)
      : blueprint["validate-appmap"] === "off"
      ? validate_appmap$off(dependencies)
      : (() => {
          throw new Error("invalid instance for component validate-appmap");
        })();
  dependencies["trace"] = trace$appmap(dependencies);
  dependencies["backend"] = backend$default(dependencies);
  dependencies["spawn"] = spawn$node(dependencies);
  dependencies["configuration-helper"] =
    configuration_helper$default(dependencies);
  dependencies["uuid"] = uuid$random(dependencies);
  dependencies["service"] = service$default(dependencies);
  dependencies["http"] = http$node_http(dependencies);
  dependencies["receptor-http"] = receptor_http$http(dependencies);
  dependencies["receptor-file"] = receptor_file$file(dependencies);
  dependencies["receptor"] = receptor$default(dependencies);
  dependencies["batch"] = batch$default(dependencies);
  return dependencies["batch"];
};
