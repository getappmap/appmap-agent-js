import Mocha from "mocha";
import NodeEntryValidateMocha from "../dist/node-entry-validate-mocha.mjs";
export * from "./loader.mjs";

const { validateMocha } = NodeEntryValidateMocha({ log: "info" });
validateMocha(Mocha);
