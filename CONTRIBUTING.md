# Style

This project use functional style rather than object-oriented style.
As a rule of thumb use arrows (`=>`) instead of the `function` or `class` keyword.
Side effects should be avoided as much as possible.
There is two kinds of side effects: *external* and *internal*.
External side effects are made of input/output operations.
Due to the nature of the project, these are unavoidable.
Ideally, they should append at the boundary of the system but currently they are bit all over the place.
Internal side effects are *always* avoidable and are made of variables assignments and builtin data structure mutation -- eg: `obj[key] = val`, `arr[idx] = val`, and `weakmap.set(key, val)`.
Variable assignments should never append, always use *const* instead of *let* and *var*.
For performance reasons, memory mutation is tolerated.
Memory mutation should be applied on the smallest possible data structure.
For instance:

```js
// Bad
const state1 = {
  constant1: "foo",
  constant2: "bar",
  counter: 0,
  toggle: false,
};

// Good
const state2 = {
  constant1: "foo",
  constant2: "bar",
  counter: {value:0},
  toggle: {value: false},
};
```

# Naming Convention

* `make`: make something that is not meant to be mutated.
* `create`: create something that is meant to be mutated either directly or via one of its properties.
* `initialize` and `terminate`: initialize something that is meant to be terminated.

# Component System

Because the project should support many different use cases its components should be composable with flexibility.
This is provided through dependency injection.
Each component should export a default function that accept the other components upon which it depends.
Internally to a component, the modules should directly import themselves and *not* use dependency injection.
However the dependencies should still be manually passed around between the modules of a component.
For instance:

```js
// components/log/node/index.mjs
const log = (writable) => (message) => {
  writable.write(`${message}${"\n"}`);
};
const logError = log(process.stderr);
const logInfo = log(process.stdout);
export default (dependencies) => ({logError, logInfo});
```

```js
// components/math/common/division.mjs
export default (dependencies) => {
  const {Log:{logError}} = dependencies;
  return {
    divide: (x, y) => {
      if (y === 0) {
        logError("division by zero");
        return Infinity;
      }
      return x / y;
    }
  };
};
```

```js
// components/math/common/index.mjs
import Division from "./division.mjs";
export default (dependencies) => {
  const {Log:{logInfo}} = dependencies;
  const {devide} = Division(dependencies);
  return {
    divide: (x, y) => {
      logInfo(`deviding ${x} by ${y}`);
      return divide(x, y);
    },
  };
};
```

Remarks:

* The dependencies of a component should be shared across all the modules of the component.
* The module of a component can be imported multiple times across the component. Meaning that it may be dependency injected multiple times. This means that the `default` export of modules should be completely stateless. A module may still have a global state but it is forbidden.
* Circular dependencies between components is not possible.
* Circular dependencies internally within a component is possible but forbidden.
* A nice side effect of dependency injection, is that it directly enables components to be tested in isolation via mock objects.

# Separation Between Control and Data

Try to separate control from data as much as possible.
For instance:

* Do not use object-oriented programming as an object is precisely some data mixed with some functions.
* Higher-order functions should be used parsimoniously. NB: Dependency injection is a prime counter-example for this guideline.

# Unit Testing

Each test files should be placed in the same directory than the file it tests.
And it should be named with the `.test.mjs` conventation.
For instance `foo.test.mjs` for a test file that tests `foo.mjs`.
Test files should be standalone and directly runnable by node.
The exit code of the node process is used to determine whether the unit test passed or failed.
For assertions, the project use the [assert](https://nodejs.org/api/assert.html) native library.
For running test, the project use the [test-turtle](https://github.com/lachrist/test-turtle) package.
