import "./error.mjs";
import process from "node:process";
import { loadComponentAsync } from "../load.mjs";
import { configuration, params } from "./configuration.mjs";

const { main } = await loadComponentAsync("recorder-jest", params);

main(process, configuration);
