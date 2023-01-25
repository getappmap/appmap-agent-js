import {
  openServiceAsync,
  closeServiceAsync,
  getServicePort,
} from "../../service/index.mjs";
import { extendConfigurationPort } from "../../configuration-accessor/index.mjs";
import { logDebug } from "../../log/index.mjs";
import { createTraceServer } from "./trace.mjs";
import { createTrackServer } from "./track.mjs";

export const openReceptorAsync = async (configuration, backend) => {
  const trace_service = await openServiceAsync(
    createTraceServer(backend),
    configuration["trace-port"],
  );
  const track_service = await openServiceAsync(
    createTrackServer(backend),
    configuration["track-port"],
  );
  logDebug("Trace port: %j", getServicePort(trace_service));
  logDebug("Track port: %j", getServicePort(track_service));
  return { trace_service, track_service };
};

export const adaptReceptorConfiguration = (
  { trace_service, track_service },
  configuration,
) =>
  extendConfigurationPort(configuration, {
    "trace-port": getServicePort(trace_service),
    "track-port": getServicePort(track_service),
  });

export const closeReceptorAsync = async ({ trace_service, track_service }) => {
  await closeServiceAsync(trace_service);
  await closeServiceAsync(track_service);
};
