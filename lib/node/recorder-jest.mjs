import { default as process } from "node:process";
import "./error.mjs";
import { configuration } from "./configuration.mjs";

const {
  RecorderJest: { main },
} = await import("../../dist/bundles/recorder-cli.mjs");

main(process, configuration);
