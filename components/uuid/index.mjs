
const {APPMAP_BLUEPRINT} = globalThis;

export const {getUUID} = await import(
  branch === "test"
    ?
  blueprint.uuid
    ? `./stub/${blueprint.uuid}/index.mjs`
    : branch === "test" ? "./stub/index.mjs" : "./random/index.mjs"
);
