import { env, default as process } from "node:process";
import "./error.mjs";
import { updateEnvEndpoint } from "./env.mjs";
export * from "./loader-esm.mjs";

const { loadEnvironmentConfiguration } = await import(
  "../../dist/bundles/configuration-environment.mjs"
);

const configuration = loadEnvironmentConfiguration(env);

updateEnvEndpoint(env, configuration);

const { record } = await import("../../dist/bundles/recorder-cli.mjs");

record(process, configuration);
