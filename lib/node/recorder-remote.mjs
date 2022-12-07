import { default as process, version } from "node:process";
import "./error.mjs";
import Loader from "./loader.mjs";
import { configuration } from "./configuration.mjs";

export const { getFormat, transformSource, load } = Loader(
  version,
  configuration.hooks.esm,
);

const {
  RecorderRemote: { main },
} = await import("../../dist/bundles/recorder-cli.mjs");

main(process, configuration);
