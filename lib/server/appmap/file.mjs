import * as FileSystem from 'fs';
import * as Path from 'path';
import { parse as acorn } from 'acorn';
import { Left, Right } from '../either.mjs';

export class File {
  constructor(
    version,
    source,
    path,
    content = FileSystem.readFileSync(path, 'utf8'),
    basedir = process.cwd(),
  ) {
    this.absolute = Path.resolve(basedir, path);
    this.relative = Path.relative(basedir, this.absolute);
    this.version = version;
    this.source = source;
    this.content = content;
  }
  getAbsolutePath() {
    return this.absolute;
  }
  getRelativePath() {
    return this.relative;
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
      return new Right(
        acorn(this.content, {
          ecmaVersion: this.version,
          sourceType: this.source,
          locations: true,
        }),
      );
      // c8 vs node12
      /* c8 ignore start */
    } catch (error) {
      /* c8 ignore stop */
      return new Left(`failed to parse ${this.path} >> ${error.message}`);
    }
  }
}
