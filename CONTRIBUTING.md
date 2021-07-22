# Programming Style

This project use functional style rather than object-oriented style.
As a rule of thumb use arrows (`=>`) instead of the `function` or `class` keyword.
Side effects should be avoided as much as possible.
There is two kinds of side effects: *external* and *internal*.
External side effects are made of input/output operations.
Due to the nature of the project, these are unavoidable.
Ideally, they should append at the boundary of the system but currently they are bit all over the place.
Internal side effects are *always* avoidable and can be categorized in two.

First, environment mutations through variable assignments -- eg: `x = 123;`.
Variable mutations are forbidden on free variables.
That is that only local variables may be re-assigned.
This rule aim at making side effects more explicit.

```js
// Forbidden Environment Mutation //
{
  const createIncrement = () => {
    let value = 0;
    return () => value += 1;
  };
  const increment = createIncrement();
  console.assert(increment(), 1);
  console.assert(increment(), 2);
}
// Tolerated Environment Mutation //
{
  const aggregateFooBar = (options) => {
    let result = "";
    if (options.foo) {
      result += "foo";
    }
    if (options.bar) {
      result += "bar";
    }
    return result;
  };
  console.assert(aggregateFooBar({foo:true, bar:false}), "foo");
}
```

Second, memory/store/heap mutations through property assignments and builtin calls -- eg: `obj[key] = val`, `arr[idx] = val`, and `weakmap.set(key, val)`.
There is two rules 

The first rule mandates that memory mutations must happen on the smallest possible scale.
For instance, a data object should not mix (meant to be) immutable properties with (meant to be) mutable one.
Instead, all its properties should be (meant to be) immutable while mutations are encapsulated in smaller objects.

```js
// Forbidden Memory Mutation //
{
  const createBigState = () => ({
    constant_property_field: "foo",
    counter: 0,
  });
  const incrementBigState = (big_state) => big_state.counter += 1;
  const big_state = createBigState();
  console.assert(incrementBigState(big_state), 1);
}
// Tolerated Memory Mutation //
{
  const createCounter = () => ({value:0});
  const incrementCounter = (counter) => counter.value += 1;
  const createBigState = () => ({
    constant_property_field: "foo",
    counter: createCounter(),
  });
  const big_state = createBigState();
  const incrementBigState = ({counter}) => incrementCounter(counter);
  console.assert(incrementBigState(big_state), 1);
}
```

The second rule forbids memory mutations on free variables.
This rule also aim at making side effects more explicit.

```js
// Forbidden Memory Mutation //
const createCounter = () => ({value:0});
const incrementCounter = (counter) => counter.value += 1;
const counter = createCounter()
const increment = () => incrementCounter(counter);
```

# Side

# Variable Casing

<!-- https://www.youtube.com/watch?v=US8QG9I1XW0&t=2660s -->

We use different casing for variable throughout the project.
The casing is primarily based on the type of value that the variable is holding and secondary based on its initialization context.
First, we define the terminology for categorizing values:

* Primitive: anything that is either `null` or not of type `"object"` nor of type `"function"`.
* Function: anything that is of type `"function"`.
  * Arrow: function that does not access the `this` argument -- eg: `() => 123`.
  * Constructor: function that expects to be called with the `new` keyword -- eg: `function Foo () { this.bar = "qux"; }`.
  * Method: function that are affected
* Object: anything of type `"object"` that is not `null`.
  * Library: object whose prototype is either `null` or `Object.prototype` and whose own property values can be anything but methods. The idea of a library is that its identity does not matter, only its content does.

We can now introduce our casing rules:

* `global_`: Constant being initialized by a property access of the global object.
* `UPPER_SNAKE_CASE`: Constant variables being initialized by a primitive literal or by operations on other upper snake case variables and primitive literals.
* `lower_snake_case`: Variables holding anything that is not a function nor a library.
* `CamelCase`: Variables holding constructors, libraries, or arrow functions that return a library (aka library factories).
* `lowerCamelCase`: Variables holding arrow functions. The first word should be a verb.

Note that our casing rules are overlapping.
If multiple casing applies, the casing that appears the higher in the list should be picked.
For instance, when applicable, `UPPER_SNAKE_CASE` should preferred over `lower_snake_case`.
So `const EULER_NUMBER = 2.718;` should be preferred over `const euler_number = 2.718;`

Examples:

```js
// global_
const global_Refect_ownKeys = Reflect.ownKeys;
const {parse:global_JSON_parse} = global.JSON;
const global_JSON_stringify = JSON.stringify;

// UPPER_SNAKE_CASE
const EULER_NUMBER = 2.7183;
const PI = 3.1416;
const DOUBLE_PI = 2 * PI;

// lower_snake_case
const content = readFileSync("file.txt");
const content1 = readFileSync("file1.txt");
const foo_content = readFileSync("foo.txt");

// CamelCase
class AppmapError extends Error;
import * as FileSystem from "fs";
import Util from "lib/components/common/util.mjs";

// lowerCamelCase
const {readFileSync} = FileSystem;
const {assert, print} = Util({});
const add = (x, y) => x + y;
const addOne = (x) => add(x, 1);
```

## Factory

Because this project encourage functional style, factory functions should be preferred over constructors.
The verb used for a factory function should be based on the stuff it creates.

* Can be simply garbage-collected:
  * Function: use `generate` prefix -- eg: `fooBar = generateFooBar(...)`
  * Data:
    * Immutable: use `make` prefix -- eg: `foo = makeFoo(...)` and `foo = await makeFooAsync(...)`
    * Mutable: use `create` prefix -- eg: `foo = createFoo(...)` and `foo = await createFooAsync(...)`
  * Library: use `CamelCase` -- eg: `{foo, bar} = FooBar()`
* Requires manual cleanup:
  * Opening: use `open` prefix -- eg: `foo = openFoo(...)` or `foo = openFooAsync(...)`
  * Closing:
    * Absence of internal termination source: `await closeFooAsync(foo)`
    * Presence of internal termination source: `closeFoo(foo)` and `await awaitFoo(foo)`

# Component System

Because the project should support many different use cases its components should be composable with flexibility.
This is provided through dependency injection -- aka partial function applications -- cf: https://blog.ploeh.dk/2017/01/27/from-dependency-injection-to-dependency-rejection/ and https://www.youtube.com/watch?v=cxs7oLGrxQ4.
Each component should export a default function that accept the other components upon which it depends.
Internally to a component, the modules should directly import themselves and *not* use dependency injection.
Note that the dependencies should still be manually passed around between the modules of a component.
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
And it should be named with the `.test.mjs` convention.
For instance `foo.test.mjs` for a test file that tests `foo.mjs`.
Test files should be standalone and directly runnable by node.
The exit code of the node process is used to determine whether the unit test passed or failed.
For assertions, the project use the [assert](https://nodejs.org/api/assert.html) native library.
For running test, the project use the [test-turtle](https://github.com/lachrist/test-turtle) package.
