import * as Path from 'path';
import { strict as Assert } from 'assert';
import {
  normalizeSpecifier,
  lookupNormalizedSpecifierArray,
} from '../../../../../lib/server/configuration/specifier.mjs';

//////////
// base //
//////////

Assert.deepEqual(
  normalizeSpecifier({ base: '/', pattern: '.', flags: '', data: 123 }),
  { base: '/', pattern: '.', flags: '', data: 123 },
);

/////////////
// pattern //
/////////////

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ pattern: 'foo' }, 123),
    Path.resolve('foo.js'),
    456,
  ),
  123,
);

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ pattern: '^foo$' }, 123),
    Path.resolve('foo.js'),
    456,
  ),
  456,
);

//////////
// glob //
//////////

// normal //

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ glob: '*.js' }, 123),
    Path.resolve('foo.js'),
    456,
  ),
  123,
);

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ glob: '*.js' }, 123),
    Path.resolve('foo.mjs'),
    456,
  ),
  456,
);

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ glob: '**/*.js' }, 123),
    Path.resolve('foo/bar.js'),
    456,
  ),
  123,
);

Assert.equal(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ glob: '**/*.js' }, 123),
    Path.resolve('../foo/bar.js'),
    456,
  ),
  456,
);

//////////
// Path //
//////////

// file //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo.js' }, 123),
    Path.resolve('foo.js'),
    456,
  ),
  123,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo.js' }, 123),
    Path.resolve('foo.js/bar.js'),
    456,
  ),
  456,
);

// directory //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo' }, 123),
    Path.resolve('foo/bar.js'),
    456,
  ),
  123,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo.js/' }, 123),
    Path.resolve('foo.js/bar.js'),
    456,
  ),
  123,
);

// recursive //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo' }, 123),
    Path.resolve('foo/bar/qux.js'),
    456,
  ),
  456,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ path: 'foo', recursive: true }, 123),
    Path.resolve('foo/bar/qux.js'),
    456,
  ),
  123,
);

//////////
// Dist //
//////////

// normal //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo' }, 123),
    Path.resolve('node_module/foo/bar.js'),
    456,
  ),
  123,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo' }, 123),
    Path.resolve('node_module/qux/bar.js'),
    456,
  ),
  456,
);

// recursive //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo' }, 123),
    Path.resolve('node_module/foo/bar/qux.js'),
    456,
  ),
  456,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo', recursive: true }, 123),
    Path.resolve('node_module/foo/bar/qux.js'),
    456,
  ),
  123,
);

// nested //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo' }, 123),
    Path.resolve('bar/node_module/foo/qux.js'),
    456,
  ),
  456,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo', nested: true }, 123),
    Path.resolve('bar/node_module/foo/qux.js'),
    456,
  ),
  123,
);

// external //

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo' }, 123),
    Path.resolve('../node_module/foo/bar.js'),
    456,
  ),
  456,
);

Assert.deepEqual(
  lookupNormalizedSpecifierArray(
    normalizeSpecifier({ dist: 'foo', external: true }, 123),
    Path.resolve('../node_module/foo/bar.js'),
    456,
  ),
  123,
);
