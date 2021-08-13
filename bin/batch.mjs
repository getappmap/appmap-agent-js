#!/usr/bin/env node

import BatchBoot from "../dist/node-batch-boot.mjs";
import Batch from "../dist/node-batch.mjs";

const { loadConfiguration } = BatchBoot({log:"info"});
const configuration = loadConfiguration(process);
const {
  mode,
  protocol,
  "log-level": log_level,
  validate: { appmap: validate_appmap, message: validate_message },
} = configuration;
const { mainAsync } = Batch({
  log: log_level,
  server: mode === "local" ? "stub" : protocol,
  "validate-appmap": validate_appmap ? "on" : "off",
  "validate-message": validate_message ? "on" : "off",
});
mainAsync(process, configuration);
