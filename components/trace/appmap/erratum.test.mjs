import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Erratum from "./erratum.mjs";

const {
  deepEqual: assertDeepEqual,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { substituteErratum } = Erratum(dependencies);

assertDeepEqual(
  substituteErratum([
    {
      type: "begin",
      index: 123,
      time: 456,
      data: {
        type: "response",
        protocol: `HTTP/1.1`,
        method: "GET",
        headers: {},
        url: "/val",
        route: null,
      },
    },
    {
      type: "erratum",
      index: 123,
      time: 789,
      data: {
        type: "begin",
        data: {
          type: "response",
          protocol: `HTTP/1.1`,
          method: "GET",
          headers: {},
          url: "/val",
          route: "/:key",
        },
      },
    },
  ]),
  [
    {
      type: "begin",
      index: 123,
      time: 456,
      data: {
        type: "response",
        protocol: `HTTP/1.1`,
        method: "GET",
        headers: {},
        url: "/val",
        route: "/:key",
      },
    },
  ],
);
