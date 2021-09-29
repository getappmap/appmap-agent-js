import Boot from "../dist/node-boot.mjs";
import Batch from "../dist/node-batch.mjs";
import { getBootBlueprint, createBlueprint } from "./blueprint.mjs";

const { bootBatchAsync } = Boot(getBootBlueprint());
const configuration = await bootBatchAsync(process);
const { mainAsync } = Batch(createBlueprint(configuration));
mainAsync(process, configuration);
