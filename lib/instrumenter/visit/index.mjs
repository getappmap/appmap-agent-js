
import * as Acorn from 'acorn';
import * as Esprima from 'esprima';
import Logger from './logger.mjs';

const logger = new Logger(import.meta.url);

const isNotNull = (any) => any !== null;

export const visit = (content, options) => {
  options = {
    depth: Infinity,
    sourceType: "script",
    ecmaVersion: 2020,
    ...options
  };
  if (options.depth === 0) {
    return content;
  }
  return Esprima.generate(Acorn.parse(content, {
    ecmaVersion: 2020,
    sourceType: options.sourceType
  }));
};

const visitors = {};
