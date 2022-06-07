import AppmapValidate from "@appland/appmap-validate";

const { validate: validateAppmap } = AppmapValidate;

export default (dependencies) => {
  const {
    expect: { expectSuccess },
  } = dependencies;
  return {
    validateAppmap: (data) => {
      expectSuccess(
        () => validateAppmap(data, { version: "1.6.0" }),
        "failed to validate appmap\n%j\n%O",
        data,
      );
    },
  };
};
