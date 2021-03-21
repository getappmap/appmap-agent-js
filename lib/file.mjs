import * as FileSystem from 'fs';
import { parse as acorn } from 'acorn';

export default class File {
  constructor(path, version, source) {
    this.path = path;
    this.version = version;
    this.source = source;
    this.content = FileSystem.readFileSync(path, 'utf8');
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
    return acorn(this.content, {
      ecmaVersion: this.version,
      sourceType: this.source,
      locations: true,
    });
  }
}
