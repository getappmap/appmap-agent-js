import Setup from "../../dist/node/setup.mjs";

const { mainAsync } = Setup({ log: "info" });

export default mainAsync(process);
