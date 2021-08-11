#!/usr/bin/env node

import ConfigurationBoot from "../dist/node-configuration-boot.mjs";
import Batch from "../dist/node-batch.mjs";

const { env, cwd, argv } = process;
const {
  createRootConfiguration,
  extendConfigurationFile,
  extendConfigurationArgv,
} = ConfigurationBoot({ log: "info" });
let configuration = createRootConfiguration(cwd(), env);
configuration = extendConfigurationFile(configuration, cwd(), env);
configuration = extendConfigurationArgv(configuration, cwd(), argv);
const { protocol, "log-level": log_level } = configuration;
const { main } = Batch({
  log: log_level,
  server: protocol === "inline" ? "stub" : protocol,
});
main(process, configuration);
