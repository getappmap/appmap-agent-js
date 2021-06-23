import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.6.0';

const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

// const isAsynchronousCallEvent = (event) =>
//   Reflect.getOwnPropertyDescriptor(event, 'http_client_request') !==
//     undefined ||
//   Reflect.getOwnPropertyDescriptor(event, 'http_server_request') !==
//     undefined ||
//   Reflect.getOwnPropertyDescriptor(event, 'sql_query') !== undefined;

const isNotLinkEvent = ({ event }) => event !== 'link';

const manufactureStack = (events) => {
  const stack = [];
  let max = 0;
  for (let event of events) {
    if (event.id > max) {
      max = event.id;
    }
  }
  const makeReturnEvent = (parent) => {
    let event = {
      thread_id: parent.thread_id,
      event: 'return',
      id: (max += 1),
      parent_id: parent.id,
    };
    if (
      Reflect.getOwnPropertyDescriptor(parent, 'http_client_request') !==
      undefined
    ) {
      event = {
        ...event,
        http_client_response: {
          status_code: 100,
        },
      };
    } else if (
      Reflect.getOwnPropertyDescriptor(parent, 'http_server_request') !==
      undefined
    ) {
      event = {
        ...event,
        http_server_response: {
          status_code: 100,
        },
      };
    } else {
      assert(
        Reflect.getOwnPropertyDescriptor(parent, 'sql_query') !== undefined,
        'expected a sql query, got: %o',
        parent,
      );
    }
    return event;
  };
  for (let index1 = 0; index1 < events.length; index1 += 1) {
    const event1 = events[index1];
    if (event1.event === 'link') {
      events = [
        ...events.slice(0, index1 + 1),
        ...events.filter(
          (event2, index2) =>
            index2 > index1 && event2.thread_id === event1.child_thread_id,
        ),
        ...events.filter(
          (event2, index2) =>
            index2 > index1 && event2.thread_id !== event1.child_thread_id,
        ),
      ];
    } else if (event1.event === 'call') {
      stack.push(event1);
    } else {
      assert(event1.event === 'return', 'invalid event %o', event1);
      assert(stack.length > 0, 'unexpected empty stack');
      const event2 = stack.pop();
      if (event1.parent_id !== event2.id) {
        const index3 = events.findIndex(
          (event3, index3) =>
            index3 > index1 &&
            event3.event === 'return' &&
            event3.parent_id === event2.id,
        );
        if (index3 === -1) {
          events = [
            ...events.slice(0, index1),
            makeReturnEvent(event2),
            ...events.slice(index1),
          ];
        } else {
          events = [
            ...events.slice(0, index1),
            events[index3],
            ...events.slice(index1, index3),
            ...events.slice(index3 + 1),
          ];
        }
      }
    }
  }
  if (stack.length > 0) {
    events = [...events, ...stack.reverse().map(makeReturnEvent)];
  }
  return events.filter(isNotLinkEvent).map(resetThreadId);
};

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
  toggle(running) {
    assert(this.running !== null, 'terminated recording %o', this);
    if (this.running === running) {
      return new Left('the recording is already in the desired state');
    }
    this.running = running;
    return new Right(null);
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
