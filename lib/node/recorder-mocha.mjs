import process from "node:process";
import Mocha from "mocha";
import "./error.mjs";
import { configuration } from "./configuration.mjs";

const { validateMocha } = await import("../../dist/bundles/validate-mocha.mjs");

validateMocha(Mocha);

const {
  RecorderMocha: { createMochaHooks },
} = await import("../../dist/bundles/recorder-cli.mjs");

export const mochaHooks = createMochaHooks(process, configuration);
