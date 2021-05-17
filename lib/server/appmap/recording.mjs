import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.5.0';

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

const split = (path) => {
  if (path === '') {
    return [];
  }
  return path.split(Path.sep);
};

const save = (recording, versioning) => {
  assert(recording.running !== null, 'terminated recording %o', recording);
  recording.running = null;
  const roots = [];
  for (const { path, entities } of recording.origins) {
    split(
      Path.relative(recording.configuration.getBasePath(), Path.dirname(path)),
    )
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
      metadata: recording.configuration.getMetaData(),
      classMap: roots,
      events: recording.events,
    }),
    path: `${versioning(recording.configuration.getOutputPath())}.appmap.json`,
  };
};

export class Recording {
  constructor(configuration) {
    this.configuration = configuration;
    this.events = [];
    this.origins = new Set();
    this.running = true;
  }
  terminate(versioning) {
    const { path, content } = save(this, versioning);
    try {
      FileSystem.writeFileSync(path, content, 'utf8');
    } catch (error) {
      return new Left(
        `failed to write appmap to file ${path} >> ${error.message}`,
      );
    }
    return new Right(null);
  }
  terminateAsync(versioning) {
    const { path, content } = save(this, versioning);
    return new Promise((resolve, reject) => {
      FileSystem.writeFile(path, content, 'utf8', (error) => {
        if (error) {
          resolve(
            new Left(
              `failed to write appmap to file ${path} >> ${error.message}`,
            ),
          );
        } else {
          resolve(new Right(null));
        }
      });
    });
  }
  toggle() {
    assert(this.running !== null, 'terminated recording %o', this);
    this.running = !this.running;
    return this.running;
  }
  register(origin) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (this.running && !this.configuration.isClassMapPruned()) {
      this.origins.add(origin);
    }
  }
  record(origin, event) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (origin === null) {
      this.events.push(event);
    } else {
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
}
