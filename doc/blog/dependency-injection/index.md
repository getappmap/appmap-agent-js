
# In Defense of Dependency Injection

Straight imports are rigid, they do not allow to compose your application in different ways. There are at least three axes in which the agent can be build:

1. Production environment vs Unit test environment
  - Remove sources of randomness -- eg: `time/stub` and `uuid/stub` components
  - Cut off some parts of the system you don't want to test -- eg: `client/spy` and `spawn/spy`
2. Inline vs Remote: whether or not trace compiling and storing is inlined with the process under test. Inline is faster, but remote is safer. For now the remote server is actually local but it would be pretty cool to provide a public server ourselves.
  - `client/{inline,node-tcp,node-http}`
3. Node vs Browser: customize functionality based on the platform
  - `interpretation/{node,browser}`: execute a code as global script (different from eval, allows 'secret' global variables that are not in the global object).
  - `client/{node-tcp,browser-http}`: communication with the server

Let's explore an alternative where the system is build with the same components but they directly import each others.
Now, the components must rely on configuration at runtime to provide custom behavior.

By dependency injection:

```js
// foo/fooA/index.mjs
export default (dependencies) => ({
  createFoo: (configuration) => ({/* fooA stuff */}),
});
```

```js
// foo/fooB/index.mjs
export default (dependencies) => ({
  createFoo: (configuration) => ({/* fooB stuff */ }),
});
```

By configuration:

```js
// foo/index.mjs
createFoo: (configuration) => {
  if (configuration.foo === "fooA") {
    return {/* fooA stuff */};
  }
  if (configuration.foo === "fooB") {
    return {/* fooB stuff */};
  }
  throw new Error("invalid component name");
};
```

Advantage of the first options:
First I think it is cleaner.
Second and more importantly, it makes it easier to support the node-browser axis.
Indeed some code should just not be part of the build -- eg: `import 'fs'`.
As the system can be build statically (generate one custom entry file that uses only static imports), it can be directly served to browsers.
Alternatively a regular bundler like `webpack` can directly bundle the application from the generated entry file.

Advantage of the second options:
Even more flexible, multiple component implementations can co-exists in the same build.
Whereas in my build only one component implementation is allowed because one is picked at build time.
However, I don't think that the build axes I made should ever be crossed during the same agent instance.
