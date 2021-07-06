
import {constant} from "../../../util/index.mjs";
const global_document = document;

export default = (dependencies, options) => ({
  runScript: (script) => {
    const element = global_document.createElement("script");
    element.type = "text/javascript";
    element.text = script;
    global_document.body.appendChild(element);
  },
  getCurrentGroup: constant(0),
  start: (traps) => {},
  stop: () => {},
})
