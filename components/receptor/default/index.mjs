import {
  openServiceAsync,
  closeServiceAsync,
  getServicePort,
} from "../../service/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { createTraceServer } from "./trace.mjs";
import { createTrackServer } from "./track.mjs";

export const openReceptorAsync = async (configuration, backend) => {
  const trace_service = await openServiceAsync(
    createTraceServer(backend),
    configuration["trace-port"],
  );
  const track_service = await openServiceAsync(
    createTrackServer(configuration, backend),
    configuration["track-port"],
  );
  logDebug("Trace port: %j", getServicePort(trace_service));
  logDebug("Track port: %j", getServicePort(track_service));
  return { trace_service, track_service };
};

export const getReceptorTracePort = ({ trace_service }) =>
  getServicePort(trace_service);

export const getReceptorTrackPort = ({ track_service }) =>
  getServicePort(track_service);

export const closeReceptorAsync = async ({ trace_service, track_service }) => {
  await closeServiceAsync(trace_service);
  await closeServiceAsync(track_service);
};
