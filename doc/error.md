                | InternalError | ExternalError  | InnerExternalError   | OuterExternalError |
==============================================================================================
Location of the | Inside the    | Out of the     | Out of the module or | Out of the package |
root cause of   | module or its | module or its  | its deps. but still  |                    |
the error       | deps.         | deps           | inside the package   |                    |
==============================================================================================
Did the module  | No            | Yes            | Yes                  | Yes                |
and its deps.   |               |                |                      |                    |
behaved as      |               |                |                      |                    |
expected?       |               |                |                      |                    |
==============================================================================================
Did the package | No            | Maybe          | No                   | Yes                |
behaved as      |               |                |                      |                    |
expected?       |               |                |                      |                    |
==============================================================================================
Is a bug?       | Yes           | Maybe          | Yes                  | No                 |
==============================================================================================

** Any other kind of error must be considered as an internal error. **

NB: The classification above presuposes that types are correct.
For instance, consider the following function:

```js
const exponent = (base /* integer */, exponent /* integer */) => {
  if (exponent < 0) {
    throw new ExternalError("expected a positive integer");
  }
  let result = 1;
  for (let index = 0; index < exponent; index++) {
    result *= base;
  }
  if (result !== base ** exponent) {
    throw new InternalError("unexpected result");
  }
  return result;
};
```

Its implementation is correct and as long as it is given integers,
it will never throw any other exceptions than ExternalError.
However if we pass floats it will throw a ModuleInternalError.
And if we pass symbols it will throw a TypeError.

```js
export class InternalError extends Error;

export class ExternalError extends Error;

export class InnerExternalError extends ExternalError;

export class OuterExternalError extends ExternalError;
```
