#!/usr/bin/env node

import ConfigurationBoot from "../dist/node-configuration-boot.mjs";
import Batch from "../dist/node-batch.mjs";

const server_instance_mapping = {
  inline: "stub",
  tcp: "tcp",
};

const { env, cwd, argv } = process;
const {
  createRootConfiguration,
  extendConfigurationFile,
  extendConfigurationArgv,
} = ConfigurationBoot({ log: "info" });
let configuration = createRootConfiguration(cwd(), env);
configuration = extendConfigurationFile(configuration, cwd(), env);
configuration = extendConfigurationArgv(configuration, cwd(), argv);
const {
  protocol,
  "log-level": log_level,
  validate: { appmap: validate_appmap, message: validate_message },
} = configuration;
const { mainAsync } = Batch({
  log: log_level,
  server: server_instance_mapping[protocol],
  "validate-appmap": validate_appmap ? "on" : "off",
  "validate-message": validate_message ? "on" : "off",
});
mainAsync(process, configuration);
