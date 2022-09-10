import { executionAsyncId as getCurrentGroup } from "async_hooks";

export default (_dependencies) => {
  return { getCurrentGroup };
};
