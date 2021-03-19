
import * as Acorn from 'acorn';
import * as Escodegen from 'escodegen';
import Logger from '../logger.mjs';
import visit from "./visit.mjs";

const logger = new Logger(import.meta.url);

export const visit = (file, namespace, options) => {
  const currated = {
    depth: Infinity,
    source: "script",
    ecmascript: 2020,
    ...options
  };
  if (options.depth === 0) {
    return file.content;
  }
  const node = 
  return Escodegen.generate(visit(Acorn.parse(file.content, {
    ecmaVersion: currated.ecmascript,
    sourceType: currated.source
  }), new Location(file, [], 
    namespace,
    file,
    depth: currated.depth,
    ecmascript: currated.ecmascript
  }));
};

