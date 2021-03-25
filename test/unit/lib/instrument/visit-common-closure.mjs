import { parse, mockResult, compareResult } from './__fixture__.mjs';
import { RootLocation } from '../../../../lib/instrument/location.mjs';
import File from '../../../../lib/file.mjs';
import Namespace from '../../../../lib/namespace.mjs';
import {
  assignVisitorObject,
  visit,
} from '../../../../lib/instrument/visit.mjs';
import '../../../../lib/instrument/visit-common-closure.mjs';

Error.stackTraceLimit = Infinity;

[
  'Expression',
  'Pattern',
  'RestablePattern',
  'ScopingIdentifier',
  'NonScopingIdentifier',
].forEach((kind) => {
  assignVisitorObject(kind, {
    Identifier: (node, location) =>
      mockResult(parse('Expression', `${kind}_${node.name}`), []),
  });
});

const namespace = new Namespace('$');

{
  const file = new File(
    `filename.js`,
    2020,
    'script',
    `const f = (x, y) => r;`,
  );
  const location0 = new RootLocation(file, namespace);
  const node1 = file.parse();
  const location1 = location0.extend('Program', node1);
  const node2 = node1.body[0];
  const location2 = location1.extend('Satatement', node2);
  const node3 = node2.declarations[0];
  const location3 = location2.extend('VariableDeclarator', node3);
  const node4 = node2.declarations[0].init;
  compareResult(
    visit('Expression', node4, location3),
    mockResult(
      parse(
        'Expression',
        `
        ($_LOCAL_ARGUMENT_0, $_LOCAL_ARGUMENT_1) => {
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
              $_GLOBAL_SERIALIZE_PARAMETER($_LOCAL_ARGUMENT_1, 'y')
            ],
            static: false
          });
          try {
            var Pattern_x = $_LOCAL_ARGUMENT_0, RestablePattern_y = $_LOCAL_ARGUMENT_1;
            return $_LOCAL_SUCCESS = Expression_r;
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
        }
    `,
      ),
      [
        {
          type: 'class',
          name: '@f|const',
          childeren: [
            {
              type: 'function',
              name: '()',
              source: `(x, y) => r`,
              location: `filename.js:1`,
              labels: [],
              comment: null,
              static: false,
            },
          ],
        },
      ],
    ),
  );
}
