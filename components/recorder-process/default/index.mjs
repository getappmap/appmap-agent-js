const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { createRecorder, recordStartTrack } = await import(
  `../../recorder-cli/index.mjs${__search}`
);

export const main = (process, configuration) => {
  const recorder = createRecorder(process, configuration);
  if (recorder !== null) {
    recordStartTrack(recorder, "process", {}, null);
  }
};
