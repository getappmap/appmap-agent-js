import Setup from "../../dist/node/setup.mjs";

const {process} = globalThis;

const { mainAsync } = Setup({ log: "info" });

export default mainAsync(process);
