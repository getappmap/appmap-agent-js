import { buildTestDependenciesAsync } from "../../build.mjs";
import ValidateMocha from "./index.mjs";

const { validateMocha } = ValidateMocha(
  await buildTestDependenciesAsync(import.meta.url),
);
validateMocha({ prototype: { version: "8.1.2" } });
