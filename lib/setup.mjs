import Setup from "../dist/node-setup.mjs";

const mainAsync = Setup({log: "info"});

process.exit((await mainAsync(process)) ? 0 : 1);
