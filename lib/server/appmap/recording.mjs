import * as FileSystem from "fs";
import * as Path from "path";
import {assert} from "../assert.mjs";
import {Left, Right} from "../either.mjs";

const VERSION = '1.4';

const navigate = (childeren, name) => {
  for (const child of childeren) {
    if (child.type === 'package' && child.name === name) {
      return child.childeren;
    }
  }
  const child = {
    type: 'package',
    name,
    childeren: [],
  };
  childeren.push(child);
  return child.childeren;
};

const save = (recording, versionning) => {
  assert(this.running !== null, "terminated recording %o", this);
  this.running = null;
  const roots = [];
  for (const {path, entities} of recording.origins) {
    Path.split(Path.dirname(path))
      .reduce(navigate, roots)
      .push({
        type: 'class',
        name: Path.basename(path),
        childeren: entities,
      });
  }
  return {
    content: JSON.stringify({
      version: VERSION,
      metadata: recording.metadata,
      classMap: roots,
      events: recording.events,
    }),
    path: `${this.versionning(this.configuration.getOutputPath())}.appmap.json`
  };
};

export class Recording {
  constructor (configuration, versioning) {
    this.configuration = configuration;
    this.events = [];
    this.origins = new Set();
    this.running = true;
    this.versioning = versioning;
  }
  terminate () {
    const {path, content} = save(this);
    try {
      FileSystem.writeFileSync(path, content, 'utf8');
    } catch (error) {
      return new Left(`failed to write appmap to file ${path} >> ${error.mesage}`);
    }
    return new Right(null);
  }
  terminateAsync () {
    const {path, content} = save(this);
    new Promise((resolve, reject) => {
      FileSystem.writeFile(path, content, 'utf8', (error) => {
        if (error) {
          resolve(new Left(`failed to write appmap to file ${path} >> ${error.mesage}`));
        } else {
          resolve(new Right(null));
        }
      });
    });
  }
  toggle () {
    assert(this.running !== null, "terminated recording %o", this);
    this.running = !this.running;
  }
  register (origin) {
    assert(this.running !== null, "terminated recording %o", this);
    if (this.running && !this.configuration.isClassMapPruned()) {
      this.origins.add(origin);
    }
  }
  record(origin, event) {
    assert(this.running !== null, "terminated recording %o", this);
    if (this.running) {
      if (this.configuration.isEventPruned()) {
        if (this.origins.has(origin)) {
          this.events.push(event);
        }
      } else {
        this.origins.add(origin);
        this.events.push(event);
      }
    }
  }
}
