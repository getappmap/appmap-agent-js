import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.6.0';

const isNotNull = (any) => any !== null;

const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

const navigate = (children, name) => {
  for (const child of children) {
    if (child.type === 'package' && child.name === name) {
      return child.children;
    }
  }
  const child = {
    type: 'package',
    name,
    children: [],
  };
  children.push(child);
  return child.children;
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
      Path.relative(
        recording.configuration.getBaseDirectory(),
        Path.dirname(path),
      ),
    )
      .reduce(navigate, roots)
      .push({
        type: 'package',
        name: Path.basename(path),
        children: entities,
      });
  }
  return {
    content: JSON.stringify({
      version: VERSION,
      metadata: recording.configuration.getMetaData(),
      classMap: roots,
      events: manufactureStack(recording.events),
    }),
    path: `${versioning(recording.configuration.getOutputPath())}.appmap.json`,
  };
};
