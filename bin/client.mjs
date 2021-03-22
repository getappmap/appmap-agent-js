
import minimist from "minimist";
import main from "../lib/main.mjs";

console.log(main(Minimist(process.argv.slice(2))));
