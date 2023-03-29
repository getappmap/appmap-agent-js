import {
  assertThrow,
  assertDeepEqual,
  assertEqual,
} from "../../__fixture__.mjs";
import * as Util from "./util.mjs";

const { Error } = globalThis;

const { resolveHostPath, parseHost, toSocketAddress, toPort } = Util;

// partial //

{
  const returnArgumentArray = (...xs) => xs;
  const testPartial = (spec) => {
    const xs = [];
    const ys = [];
    const zs = [];
    for (let index = 0; index < spec.length; index += 1) {
      if (spec[index] === "x") {
        xs.push(index);
      } else if (spec[index] === "_") {
        ys.push(index);
      } else {
        throw new Error("invalid spec char");
      }
      zs.push(index);
    }
    assertDeepEqual(
      Util[`partial${spec}`](returnArgumentArray, ...xs)(...ys),
      zs,
    );
  };
  [
    "x_",
    "x__",
    "xx_",
    "xx__",
    "x___",
    "xx___",
    "xxx___",
    "xx____",
    "xxx____",
  ].forEach(testPartial);
}

// resolveHostPath //

assertEqual(
  resolveHostPath({ name: "name", port: 8080 }, "/path"),
  "http://name:8080/path",
);

assertEqual(
  resolveHostPath({ name: "name", port: 8080 }, "http://host/path"),
  "http://host/path",
);

// parseHost //

assertDeepEqual(parseHost("name:8080"), { name: "name", port: 8080 });

assertDeepEqual(parseHost("name"), { name: "name", port: 80 });

// toPort //

assertEqual(toPort("/unix-domain-socket"), "/unix-domain-socket");

assertEqual(toPort({ port: 8080 }), 8080);

assertThrow(
  () => toPort(123),
  /^InternalAppmapError: invalid server address$/u,
);

// toSocketAddress //

assertDeepEqual(toSocketAddress("/unix-domain-socket"), {
  path: "/unix-domain-socket",
});

assertDeepEqual(toSocketAddress({ port: 8080 }), {
  host: "localhost",
  port: 8080,
});

assertThrow(
  () => toSocketAddress(123),
  /^InternalAppmapError: invalid server address$/u,
);
