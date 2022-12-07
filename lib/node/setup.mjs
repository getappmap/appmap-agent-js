import process from "node:process";
import "./error.mjs";

const { mainAsync } = await import("../../dist/bundles/setup.mjs");

export default mainAsync(process);
