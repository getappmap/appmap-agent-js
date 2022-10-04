const { process } = globalThis;

export { transformSource, load } from "./__common__.mjs";

import { configuration, params } from "./__common__.mjs";

const { main } = await import(
  `../../components/recorder-remote/index.mjs?${params.toString()}`
);

main(process, configuration);
