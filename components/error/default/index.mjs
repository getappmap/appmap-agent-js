const { URL, Error } = globalThis;

const { search: __search } = new URL(import.meta.url);

const issues = "https://github.com/getappmap/appmap-agent-js/issues";
const slack = "https://appmap-group.slack.com/archives/C03GEJVDC2J";
const discord =
  "https://discord.com/channels/766016904056930325/818522100205223996";
const documentation =
  "https://github.com/getappmap/appmap-agent-js/blob/main/REFERENCE.md";
const instruction = "https://appmap.io/docs/appmap-overview.html";

const internal_message = `
Detected an internal appmap error.\
 This is probably an issue within the appmap framework.\
 Please consider submitting a bug report at:
  ${issues}

`;

const external_message = `
Detected an external appmap error.\
 This is probably a issue with how you used the appmap framework.
- You can look for answers in our installation instructions:
    ${instruction}
- We also have a reference documentation:
    ${documentation}
- You can ask for help in our public slack channel:
    ${slack}
- We also have a public discord:
    ${discord}

`;

const unknown_message = `
Detected an unknown error.\
 Does this error disappear when not recording your application?\
 If yes, this is probably an issue within the appmap framework.\
 Please consider submitting a bug report at:
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
  if (error instanceof InternalAppmapError) {
    return internal_message;
  } else if (error instanceof ExternalAppmapError) {
    return external_message;
  } else {
    return unknown_message;
  }
};