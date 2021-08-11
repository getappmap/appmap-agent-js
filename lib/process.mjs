import ConfigurationBoot from "../dist/node-configuration-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";
export * from "./loader.mjs";

const client_instance_mapping = {
  inline: "inline",
  tcp: "node-tcp",
};

const { env } = process;
const { loadRootConfiguration } = ConfigurationBoot({ log: "info" });
const configuration = loadRootConfiguration(env);
const { protocol, "log-level": log_level } = configuration;
const { mainAsync } = RecorderProcess({
  log: log_level,
  client: client_instance_mapping[protocol],
});
mainAsync(process, configuration);
