/* eslint import/extensions: off */

// https://github.com/nodejs/node/blob/606df7c4e79324b9725bfcfe019a8b75bfa04c3f/test/fixtures/es-module-loaders/transform-source.mjs
// --experimental-loader ./loader-name.mjs


// https://github.com/nodejs/node/blob/22293eab481548c7dba3ffd320487d4f267b977b/lib/internal/modules/esm/transform_source.js
// https://github.com/nodejs/node/blob/606df7c4e79324b9725bfcfe019a8b75bfa04c3f/test/fixtures/es-module-loaders/transform-source.mjs

import setup from "./setup.js";
import hookCommonJS from "./hook-common-js.js";

// const global_TextDecoder = TextDecoder;
const global_URL = URL;

const {instrumentScript, instrumentModule} = setup(process);
hookCommonJS(instrumentScript);

export function transformSource(content, context, defaultTransformSource) {
  return new Promise((resolve, reject) => {
    if (context.format === 'module' && typeof content === 'string') {
      // if (typeof content !== 'string') {
      //   content = new global_TextDecoder().decode(content);
      // }
      instrumentModule(new GlobalURL(context.url).pathname, content, {resolve, reject});
    } else {
      resolve(defaultTransformSource(content, context, defaultTransformSource));
    }
  });
};


// import * as XMLHttpRequest from "xmlhttprequest";
//
// global.XMLHttpRequest = XMLHttpRequest;
//
// let script = FileSystem.readFileSync(Path.join(dirname, "..", "src" "es2015.js", "utf8");
// script = script.replace(/APPMAP_GLOBAL_/gu, () => prefix);
// script = script.replace(/APPMAP_STATIC_([A-Z_]*)/gu, (match, part) => prefix);
//
// VirtualMachine.runInThisContext(script);
//
// delete global.XMLHttpRequest;
