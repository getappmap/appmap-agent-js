import { env } from "node:process";
import { updateEnvEndpoint } from "./env.mjs";

const { loadEnvironmentConfiguration } = await import(
  "../../dist/bundles/configuration-environment.mjs"
);

export const configuration = loadEnvironmentConfiguration(env);

updateEnvEndpoint(env, configuration);
