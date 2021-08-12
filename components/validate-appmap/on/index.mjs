import { validate as validateAppmap } from "@appland/appmap-validate";

export default (dependencies) => {
  const {
    expect: { expectSuccess },
  } = dependencies;
  return {
    validateAppmap: (data) => {
      expectSuccess(
        () => validateAppmap({ data, version: "1.6.0" }),
        "failed to validate appmap >> %e",
      );
    },
  };
};
