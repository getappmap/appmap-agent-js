import ConfigurationBoot from "../dist/node-configuration-boot.mjs";
import RecorderProcess from "../dist/node-recorder-process.mjs";
export * from "./loader.mjs";

const {env} = process;
const {loadRootConfiguration} = ConfigurationBoot({log:"info"});
const configuration = loadRootConfiguration(env);
const {protocol, "log-level":log_level} = configuration;
const {main} = RecorderProcess({log:log_level, client:protocol});
main(process, configuration);
