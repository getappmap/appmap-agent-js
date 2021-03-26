import { test } from './__fixture__.mjs';
import '../../../../lib/instrument/visit-closure.mjs';

Error.stackTraceLimit = Infinity;

const prefix = '$';

test({
  prefix,
  input: `function f () { return x; }`,
  output: `function f () { return $_LOCAL_SUCCESS = x; }`,
  keys: [['body', 0], 'body', ['body', 0]],
});

test({
  prefix,
  input: `function f () { return; }`,
  output: `function f () { return $_LOCAL_SUCCESS = $_GLOBAL_UNDEFINED; }`,
  keys: [['body', 0], 'body', ['body', 0]],
});

test({
  prefix,
  path: 'filename.js',
  input: `const f = (x, y, ...z) => t;`,
  output: `const f = ($_LOCAL_ARGUMENT_0, $_LOCAL_ARGUMENT_1, ...$_LOCAL_ARGUMENT_2) => {
    var
      $_LOCAL_TIMER = $_GLOBAL_GET_NOW(),
      $_LOCAL_EVENT_IDENTITY = $_GLOBAL_EVENT_COUNTER += 1,
      $_LOCAL_SUCCESS = $_GLOBAL_EMPTY_MARKER,
      $_LOCAL_FAILURE = $_GLOBAL_EMPTY_MARKER;
    $_GLOBAL_ADD_EVENT({
      id: $_LOCAL_EVENT_IDENTITY,
      event: 'call',
      thread_id: $_GLOBAL_PROCESS_ID,
      defined_class: 'filename.js',
      method_id: '@f|const',
      path: 'filename.js',
      lineno: 1,
      receiver: $_GLOBAL_SERIALIZE_PARAMETER($_GLOBAL_EMPTY_MARKER, 'this'),
      parameters: [
        $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_ARGUMENT_0, 'x'),
        $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_ARGUMENT_1, 'y'),
        $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_ARGUMENT_2, '...z')
      ],
      static: false
    });
    try {
      var
        x = $_LOCAL_ARGUMENT_0,
        y = $_LOCAL_ARGUMENT_1,
        z = $_LOCAL_ARGUMENT_2;
      return $_LOCAL_SUCCESS = t;
    } catch ($_LOCAL_ERROR) {
      throw $_LOCAL_FAILURE = $_LOCAL_ERROR;
    } finally {
      $_GLOBAL_ADD_EVENT({
        id: $_GLOBAL_EVENT_COUNTER += 1,
        event: 'return',
        thread_id: $_GLOBAL_PROCESS_ID,
        parent_id: $_GLOBAL_EVENT_IDENTITY,
        ellapsed: $_GLOBAL_GET_NOW() - $_LOCAL_TIMER,
        return_value: $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_SUCCESS, 'return'),
        exceptions: $_GLOBAL_SERIALIZE_EXCEPTION($_LOCAL_FAILURE)
      });
    }
  };`,
  keys: [['body', 0], ['declarations', 0], 'init'],
});

test({
  prefix,
  path: 'filename.js',
  input: `async function * f () { 123; }`,
  output: `async function * f () {
    var
      $_LOCAL_TIMER = $_GLOBAL_GET_NOW(),
      $_LOCAL_EVENT_IDENTITY = $_GLOBAL_EVENT_COUNTER += 1,
      $_LOCAL_SUCCESS = $_GLOBAL_EMPTY_MARKER,
      $_LOCAL_FAILURE = $_GLOBAL_EMPTY_MARKER;
    $_GLOBAL_ADD_EVENT({
      id: $_LOCAL_EVENT_IDENTITY,
      event: 'call',
      thread_id: $_GLOBAL_PROCESS_ID,
      defined_class: 'filename.js',
      method_id: '@f|function',
      path: 'filename.js',
      lineno: 1,
      receiver: $_GLOBAL_SERIALIZE_PARAMETER(this, 'this'),
      parameters: [],
      static: false
    });
    try {
      123;
    } catch ($_LOCAL_ERROR) {
      throw $_LOCAL_FAILURE = $_LOCAL_ERROR;
    } finally {
      $_GLOBAL_ADD_EVENT({
        id: $_GLOBAL_EVENT_COUNTER += 1,
        event: 'return',
        thread_id: $_GLOBAL_PROCESS_ID,
        parent_id: $_GLOBAL_EVENT_IDENTITY,
        ellapsed: $_GLOBAL_GET_NOW() - $_LOCAL_TIMER,
        return_value: $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_SUCCESS, 'return'),
        exceptions: $_GLOBAL_SERIALIZE_EXCEPTION($_LOCAL_FAILURE)
      });
    }
  };`,
  keys: [['body', 0]],
});
