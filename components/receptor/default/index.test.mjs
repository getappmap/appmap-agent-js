import { mkdir as mkdirAsync } from "fs/promises";
import "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs?env=test";
import { getTmpUrl } from "../../path/index.mjs?env=test";
import { toAbsoluteUrl } from "../../url/index.mjs?env=test";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs?env=test";
import {
  openReceptorAsync,
  minifyReceptorConfiguration,
  closeReceptorAsync,
  adaptReceptorConfiguration,
} from "./index.mjs?env=test";

const { URL } = globalThis;

const base = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(base));
const configuration = extendConfiguration(
  createConfiguration(base),
  { recorder: "process", appmap_dir: "directory" },
  base,
);

const receptor = await openReceptorAsync(
  minifyReceptorConfiguration(configuration),
);
adaptReceptorConfiguration(receptor, configuration);
await closeReceptorAsync(receptor);
