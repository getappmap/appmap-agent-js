import * as FileSystem from 'fs';
import { parse as acorn } from 'acorn';
import {Left, Right} from "../either.mjs";

export class File {
  constructor(
    version,
    source,
    path,
    content = FileSystem.readFileSync(path, 'utf8'),
  ) {
    this.path = path;
    this.version = version;
    this.source = source;
    this.content = content;
  }
  getPath() {
    return this.path;
  }
  getLanguageVersion() {
    return this.version;
  }
  getSourceType() {
    return this.source;
  }
  getContent() {
    return this.content;
  }
  parse() {
    try {
      return new Right(acorn(this.content, {
        ecmaVersion: this.version,
        sourceType: this.source,
        locations: true,
      }));
    } catch (error) {
      return new Left(`failed to parse ${this.path} >> ${error.message}`);
    }
  }
}
