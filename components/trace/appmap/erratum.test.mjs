import { assertDeepEqual, makeAbsolutePath } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Erratum from "./erratum.mjs";

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
        url: makeAbsolutePath("val"),
        route: null,
      },
    },
    {
      type: "begin",
      index: 123,
      time: 789,
      data: {
        type: "response",
        protocol: `HTTP/1.1`,
        method: "GET",
        headers: {},
        url: makeAbsolutePath("val"),
        route: makeAbsolutePath(":key"),
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
        url: makeAbsolutePath("val"),
        route: makeAbsolutePath(":key"),
      },
    },
  ],
);
