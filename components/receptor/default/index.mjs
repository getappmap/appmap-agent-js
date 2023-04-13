import { createPool, addPool, closePool } from "../../pool/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { convertPort, revertPort } from "./port.mjs";
import { createTraceServer } from "./trace.mjs";
import { createTrackServer } from "./track.mjs";

const { Promise } = globalThis;

/* c8 ignore start */
const partialx_ = (f, x1) => (x2) => {
  f(x1, x2);
};
/* c8 ignore stop */

export const openReceptorAsync = async (configuration, backend) => {
  const pool = createPool();
  const trace_server = createTraceServer(backend);
  const track_server = createTrackServer(configuration, backend);
  trace_server.on("connection", partialx_(addPool, pool));
  track_server.on("connection", partialx_(addPool, pool));
  trace_server.listen(convertPort(configuration["trace-port"]));
  track_server.listen(convertPort(configuration["track-port"]));
  await Promise.all([
    new Promise((resolve, reject) => {
      trace_server.on("error", reject);
      trace_server.on("listening", resolve);
    }),
    new Promise((resolve, reject) => {
      track_server.on("error", reject);
      track_server.on("listening", resolve);
    }),
  ]);
  logDebug("Trace port: %j", revertPort(trace_server.address()));
  logDebug("Track port: %j", revertPort(track_server.address()));
  return { trace_server, track_server, pool };
};

export const getReceptorTracePort = ({ trace_server }) =>
  revertPort(trace_server.address());

export const getReceptorTrackPort = ({ track_server }) =>
  revertPort(track_server.address());

export const closeReceptorAsync = async ({
  trace_server,
  track_server,
  pool,
}) => {
  trace_server.close();
  track_server.close();
  closePool(pool, 1000);
  await Promise.all([
    new Promise((resolve, reject) => {
      trace_server.on("error", reject);
      trace_server.on("close", resolve);
    }),
    new Promise((resolve, reject) => {
      track_server.on("error", reject);
      track_server.on("close", resolve);
    }),
  ]);
};
