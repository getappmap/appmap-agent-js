
import {parse as acorn} from 'acorn';
import {generate as escodegen} from 'escodegen';
// import Logger from '../logger.mjs';
import {visitProgram} from "./visit-program.mjs";
import {RootLocation} from  "./location.mjs";

// const logger = new Logger(import.meta.url);

export default (file, namespace) => escodegen(visitProgram(acorn(file.content, {
  ecmaVersion: file.getLanguageVersion(),
  sourceType: file.getSourceType()
}), new RootLocation(file, namespace)));
