/* eslint local/no-globals: ["error", "exports"] */
const main = () => "main";
const mainAsync = async () => await "main";
exports.main = main;
exports.mainAsync = mainAsync;
