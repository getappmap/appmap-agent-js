
import * as Acorn from 'acorn';
import * as Esprima from 'esprima';
import Logger from '../logger.mjs';
import Visitor from "./visitor.mjs";

const logger = new Logger(import.meta.url);

const isNotNull = (any) => any !== null;

export const visit = (content, options) => {
  const currated = {
    depth: Infinity,
    excluude: () => {},
    sourceType: "script",
    ecmaVersion: 2020,
    ...options
  };
  if (options.depth === 0) {
    return content;
  }
  return Esprima.generate(Acorn.parse(content, {
    ecmaVersion: options.ecmaVersion,
    sourceType: options.sourceType
  }));
};

