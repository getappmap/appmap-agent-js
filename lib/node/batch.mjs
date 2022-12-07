import { default as process, env } from "node:process";
import "./error.mjs";
import { updateEnvEndpoint } from "./env.mjs";

const { loadProcessConfiguration } = await import(
  "../../dist/bundles/configuration-process.mjs"
);

const configuration = loadProcessConfiguration(process);

updateEnvEndpoint(env, configuration);

const { mainAsync } = await import("../../dist/bundles/batch.mjs");

export default mainAsync(process, configuration);
