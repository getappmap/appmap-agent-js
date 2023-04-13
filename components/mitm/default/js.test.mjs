import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { createBackend } from "../../backend/index.mjs";
import { instrumentJs } from "./js.mjs";

{
  const configuration = extendConfiguration(
    createConfiguration("protocol://host/home"),
    {
      packages: {
        regexp: "script.js",
        enabled: true,
      },
    },
    "protocol://host/base",
  );
  assertEqual(
    instrumentJs(configuration, createBackend(configuration), {
      url: "protocol://host/base/script.js",
      content: "123;",
    }),
    "123;\n",
  );
}
