import { strict as Assert } from "assert";
import { AppmapExternalError } from "../../../util/index.mjs";
// import { visit } from "./visit.mjs";
import {
  testScript,
  testModule,
  getRuntimeIdentifier,
} from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-identifier.mjs";

Assert.throws(
  () => testScript(`${getRuntimeIdentifier()};`),
  AppmapExternalError,
);

testScript(`foo;`);

testScript(
  `
    ${getRuntimeIdentifier()}: while (true) {
      break ${getRuntimeIdentifier()};
      continue ${getRuntimeIdentifier()};
    }
  `,
);

testModule(
  `
    export {foo as ${getRuntimeIdentifier()}};
    import {${getRuntimeIdentifier()} as foo} from "./bar.mjs";
  `,
);

testScript(
  `
    ({${getRuntimeIdentifier()}: foo});
    foo.${getRuntimeIdentifier()};
  `,
);
