const { URL, Error } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { version } = await import(`../../version/index.mjs${__search}`);

const issues = "https://github.com/getappmap/appmap-agent-js/issues";
const slack = "https://appmap.io/slack";
const documentation =
  "https://github.com/getappmap/appmap-agent-js/blob/main/REFERENCE.md";
const instruction = "https://appmap.io/docs/appmap-overview.html";

const internal_message = `
[appmap@${version}] Detected an internal appmap error.\
 This is probably an issue with how the AppMap agent is being used.\
 Please consider submitting a bug report at:
  ${issues}

`;

const external_message = `
[appmap@${version}] Detected an external appmap error.\
 This is probably an issue with how the AppMap agent is being used.
- You can look for answers in our installation instructions:
    ${instruction}
- We also have a reference documentation:
    ${documentation}
- You can ask for help in our public slack channel:
    ${slack}

`;

const unknown_message = `
[appmap@${version}] Detected an unknown error.\
 If this error disapear when not recording your application, it is probably an issue within the appmap framework.\
 If this is the case, please consider submitting a bug report at:
  ${issues}

`;

export class AppmapError extends Error {}

export class InternalAppmapError extends AppmapError {
  constructor(message) {
    super(message);
    this.name = "InternalAppmapError";
  }
}

export class ExternalAppmapError extends AppmapError {
  constructor(message) {
    super(message);
    this.name = "ExternalAppmapError";
  }
}

export const reportError = (error) => {
  if (error.name === "InternalAppmapError") {
    return internal_message;
  } else if (error.name === "ExternalAppmapError") {
    return external_message;
  } else {
    return unknown_message;
  }
};
