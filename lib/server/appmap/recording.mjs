import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.6.0';

const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

// const profile = (fct, ...args) => {
//   const start = Date.now();
//   console.log("start");
//   try {
//     return fct(...args);
//   } finally {
//     console.log("stop", Date.now() - start);
//   }
// };

const manufactureStack = (events) => {
  // FileSystem.writeFileSync("yo.json", JSON.stringify(events, null, 2), "utf8");
  const stack = [];
  let max = 0;
  const threads = new Map();
  for (let event of events) {
    if (event.id > max) {
      max = event.id;
    }
    let thread = threads.get(event.thread_id);
    if (thread === undefined) {
      thread = [];
      threads.set(event.thread_id, thread);
    }
    thread.push(event);
  }
  const makeReturnEvent = (parent) => {
    let event = {
      event: 'return',
      thread_id: parent.thread_id,
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
  const done = new Set();
  const output = [];
  const processEvent = (event1) => {
    if (!done.has(event1)) {
      if (event1.event === 'link') {
        done.add(event1);
        if (threads.has(event1.child_thread_id)) {
          threads.get(event1.child_thread_id).forEach(processEvent);
        }
      } else if (event1.event === 'call') {
        done.add(event1);
        output.push(event1);
        stack.push(event1);
      } else {
        assert(event1.event === 'return', 'invalid event %o', event1);
        if (stack.length > 0) {
          const event2 = stack.pop();
          if (event1.parent_id === event2.id) {
            done.add(event1);
            output.push(event1);
          } else {
            let event3 = events.find(
              (event3) =>
                event3.event === 'return' && event3.parent_id === event2.id,
            );
            if (event3 === undefined) {
              event3 = makeReturnEvent(event2);
            } else {
              assert(
                !done.has(event3),
                'done event should not match call: call = %o, done = %o',
                event2,
                event3,
              );
              done.add(event3);
            }
            output.push(event3);
            processEvent(event1);
          }
        }
      }
    }
  };
  for (const events of threads.values()) {
    events.forEach(processEvent);
  }
  while (stack.length > 0) {
    output.push(makeReturnEvent(stack.pop()));
  }
  return output.map(resetThreadId);
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
      events: manufactureStack(recording.events), // profile(manufactureStack, recording.events),
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
