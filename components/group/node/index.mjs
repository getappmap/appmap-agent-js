import { executionAsyncId as getCurrentGroup } from "async_hooks";

export default (dependencies) => {
  return { getCurrentGroup };
};
