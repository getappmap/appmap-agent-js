import * as FileSystem from 'fs';
import * as Path from 'path';
import { assert } from '../assert.mjs';
import { Left, Right } from '../either.mjs';

const VERSION = '1.6.0';

const resetThreadId = (event) => ({
  ...event,
  thread_id: 0,
});

const isAsynchronousCallEvent = (event) =>
  Reflect.getOwnPropertyDescriptor(event, 'http_client_request') !==
    undefined ||
  Reflect.getOwnPropertyDescriptor(event, 'http_server_request') !==
    undefined ||
  Reflect.getOwnPropertyDescriptor(event, 'sql_query') !== undefined;

const manufactureStack = (events) => {
  const stack = [];
  let length = events.length;
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
  for (let index1 = 0; index1 < length; index1 += 1) {
    const event1 = events[index1];
    if (event1.event === 'call') {
      stack.push(event1);
      if (isAsynchronousCallEvent(event1)) {
        const index2 = events.findIndex(
          (event2, index2) =>
            index2 > index1 &&
            event2.event === 'return' &&
            event2.parent_id === event1.id,
        );
        if (index2 === -1) {
          length += 1;
          events = [
            ...events.slice(0, index1 + 1),
            makeReturnEvent(event1),
            ...events.slice(index1 + 1),
          ];
        } else {
          const child_thread_id = events[index2].thread_id;
          events = [
            ...events.slice(0, index1 + 1),
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id === child_thread_id,
            ),
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id !== child_thread_id,
            ),
          ];
        }
      }
      // if (
      //   Reflect.getOwnPropertyDescriptor(event1, 'child_thread_id') !==
      //   undefined
      // ) {
      //   assert(
      //     index1 + 1 < length &&
      //       events[index1 + 1].event === 'return' &&
      //       events[index1 + 1].parent_id === event1.id,
      //     'expected asynchronous jump to be directly followed by its return',
      //   );
      //   const { child_thread_id } = event1;
      //   const child = events.filter(
      //     (event2, index2) =>
      //       index2 > index1 && event2.thread_id === child_thread_id,
      //   );
      //   if (child.length > 0) {
      //     events = [
      //       ...events.slice(0, index1 + 1),
      //       ...child,
      //       ...events.filter(
      //         (event2, index2) =>
      //           index2 > index1 && event2.thread_id !== child_thread_id,
      //       ),
      //     ];
      //   } else {
      //     stack.pop();
      //     events[index1] = null;
      //     index1 += 1;
      //     events[index1] = null;
      //   }
      // }
    } else {
      assert(event1.event === 'return', 'invalid event %o', event1);
      const event2 = stack.pop();
      assert(
        event2.id === event1.parent_id,
        'event mismatch between %o and %o',
        event2,
        event1,
      );
      // const parent_id = parent.id;
      // if (event1.parent_id !== parent_id) {
      //   assert(
      //     Reflect.getOwnPropertyDescriptor(parent, 'http_server_request') !==
      //       undefined ||
      //       Reflect.getOwnPropertyDescriptor(parent, 'http_client_request') !==
      //         undefined ||
      //       Reflect.getOwnPropertyDescriptor(parent, 'sql_query') !== undefined,
      //     'function call event should be matched by a function return event; parent: %o child: %o',
      //     parent,
      //     event1,
      //   );
      // }
    }
  }
  assert(stack.length === 0, 'unexpected non empty stack: %o', stack);
  // if (stack.length > 0) {
  //   events = [...events, ...stack.reverse().map(makeReturnEvent)];
  // }
  return events.map(resetThreadId);
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
