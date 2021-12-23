import { buildTestDependenciesAsync } from "../../build.mjs";
import Request from "./index.mjs";

const dependencies = await buildTestDependenciesAsync(import.meta.url);

const {
  openResponder,
  listenResponderAsync,
  promiseResponderTermination,
  closeResponder,
  getResponderPort,
} = Request(dependencies);

{
  const server = openResponder();
  await listenResponderAsync(server, 0);
  getResponderPort(server);
  closeResponder(server);
  await promiseResponderTermination(server);
}
