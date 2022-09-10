import { executionAsyncId } from "async_hooks";

export default (_dependencies) => ({
  getCurrentGroup: executionAsyncId,
});
