import { assertDeepEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Amend from "./amend.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const { amend } = Amend(dependencies);

assertDeepEqual(
  amend([
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
      type: "begin",
      index: 123,
      time: 789,
      data: {
        type: "response",
        protocol: `HTTP/1.1`,
        method: "GET",
        headers: {},
        url: "/val",
        route: "/:key",
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
