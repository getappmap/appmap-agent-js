import { test } from './__fixture__.mjs';
import '../../../../../lib/server/instrument/visit-closure.mjs';

Error.stackTraceLimit = Infinity;

const prefix = '$';

test({
  prefix,
  input: `function f () { return x; }`,
  output: `function f () { return $_SUCCESS = x; }`,
  keys: [['body', 0], 'body', ['body', 0]],
});

test({
  prefix,
  input: `function f () { return; }`,
  output: `function f () { return $_SUCCESS = $.undefined; }`,
  keys: [['body', 0], 'body', ['body', 0]],
});

test({
  prefix,
  path: 'filename.js',
  input: `const f = (x, y, ...z) => t;`,
  output: `const f = ($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
    var
      $_TIMER = $.getNow(),
      $_EVENT_ID = $.counter += 1,
      $_SUCCESS = $.empty,
      $_FAILURE = $.empty;
    $.record({
      id: $_EVENT_ID,
      event: 'call',
      thread_id: $.pid,
      defined_class: 'filename.js',
      method_id: '@f|const',
      path: 'filename.js',
      lineno: 1,
      receiver: $.serializeParameter($.empty, 'this'),
      parameters: [
        $.serializeParameter($_ARGUMENT_0, 'x'),
        $.serializeParameter($_ARGUMENT_1, 'y'),
        $.serializeParameter($_ARGUMENT_2, '...z')
      ],
      static: false
    });
    try {
      var
        x = $_ARGUMENT_0,
        y = $_ARGUMENT_1,
        z = $_ARGUMENT_2;
      return $_SUCCESS = t;
    } catch ($_ERROR) {
      throw $_FAILURE = $_ERROR;
    } finally {
      $.record({
        id: $.counter += 1,
        event: 'return',
        thread_id: $.pid,
        parent_id: $_EVENT_ID,
        ellapsed: $.getNow() - $_TIMER,
        return_value: $.serializeParameter($_SUCCESS, 'return'),
        exceptions: $.serializeException($_FAILURE)
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
      $_TIMER = $.getNow(),
      $_EVENT_ID = $.counter += 1,
      $_SUCCESS = $.empty,
      $_FAILURE = $.empty;
    $.record({
      id: $_EVENT_ID,
      event: 'call',
      thread_id: $.pid,
      defined_class: 'filename.js',
      method_id: '@f|function',
      path: 'filename.js',
      lineno: 1,
      receiver: $.serializeParameter(this, 'this'),
      parameters: [],
      static: false
    });
    try {
      123;
    } catch ($_ERROR) {
      throw $_FAILURE = $_ERROR;
    } finally {
      $.record({
        id: $.counter += 1,
        event: 'return',
        thread_id: $.pid,
        parent_id: $_EVENT_ID,
        ellapsed: $.getNow() - $_TIMER,
        return_value: $.serializeParameter($_SUCCESS, 'return'),
        exceptions: $.serializeException($_FAILURE)
      });
    }
  };`,
  keys: [['body', 0]],
});
